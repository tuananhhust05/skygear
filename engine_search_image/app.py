"""
Flask API for image search using CLIP embeddings and Elasticsearch
Endpoints:
- POST /index: Index an image with rig_id
- POST /search: Search for similar images
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import tempfile
import numpy as np
from elasticsearch import Elasticsearch
import clip
import torch
from PIL import Image
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
ES_HOST = "54.79.147.183"
ES_PORT = 9200
ES_URL = f"http://{ES_HOST}:{ES_PORT}"
INDEX_NAME = "image_search_index"
VECTOR_DIMENSION = 512
MIN_COSINE_SIMILARITY = 0.7

# Initialize Elasticsearch client
es = Elasticsearch(
    [ES_URL],
    request_timeout=30,
    max_retries=10,
    retry_on_timeout=True
)

# Initialize CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading CLIP model on {device}...")
model, preprocess = clip.load("ViT-B/32", device=device)
print("CLIP model loaded successfully!")


def get_image_embedding(image_path):
    """
    Get CLIP embedding from image file
    Returns: numpy array of shape (512,)
    """
    try:
        image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = model.encode_image(image)
            embedding /= embedding.norm(dim=-1, keepdim=True)  # Normalize
        return embedding.cpu().numpy().flatten()
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")


def decode_base64_image(base64_string, temp_dir=None):
    """
    Decode base64 string to image file
    Returns: path to temporary image file
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Create temporary file
        if temp_dir is None:
            temp_dir = tempfile.gettempdir()
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        temp_file = os.path.join(temp_dir, f"temp_image_{timestamp}.jpg")
        test_file = os.path.join(temp_dir, f"test_image_.jpg")
        # Write image data to file
        with open(temp_file, 'wb') as f:
            f.write(image_data)
        with open(test_file, 'wb') as f:
            f.write(image_data)
        return temp_file
    except Exception as e:
        raise Exception(f"Error decoding base64 image: {str(e)}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check Elasticsearch connection
        if not es.ping():
            return jsonify({
                "status": "error",
                "message": "Cannot connect to Elasticsearch"
            }), 500
        
        return jsonify({
            "status": "ok",
            "message": "API is running",
            "elasticsearch": "connected",
            "clip_model": "loaded"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/index', methods=['POST', 'OPTIONS'])
def index_image():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    """
    Index an image with rig_id
    Request body:
    {
        "image": "base64_string",
        "rig_id": "rig_123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
        
        # Validate required fields
        if 'image' not in data or 'rig_id' not in data:
            return jsonify({
                "success": False,
                "message": "Both 'image' (base64) and 'rig_id' are required"
            }), 400
        
        base64_image = data['image']
        rig_id = str(data['rig_id'])
        
        if not base64_image or not rig_id:
            return jsonify({
                "success": False,
                "message": "Both 'image' and 'rig_id' cannot be empty"
            }), 400
        
        # Decode base64 to temporary file
        temp_file = None
        try:
            temp_file = decode_base64_image(base64_image)
            
            # Get embedding from image
            embedding = get_image_embedding(temp_file)
            
            # Validate embedding dimension
            if len(embedding) != VECTOR_DIMENSION:
                return jsonify({
                    "success": False,
                    "message": f"Invalid embedding dimension: {len(embedding)}, expected {VECTOR_DIMENSION}"
                }), 500
            
            # Prepare document for Elasticsearch
            doc = {
                "product_id": rig_id,
                "vector": embedding.tolist()  # Convert numpy array to list
            }
            
            # Index document in Elasticsearch
            # Use rig_id as document ID to allow updates
            result = es.index(
                index=INDEX_NAME,
                id=f"{rig_id}_{datetime.now().timestamp()}",
                document=doc
            )
            
            return jsonify({
                "success": True,
                "message": "Image indexed successfully",
                "rig_id": rig_id,
                "elasticsearch_id": result["_id"],
                "vector_dimension": len(embedding)
            }), 200
            
        finally:
            # Clean up temporary file
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error indexing image: {str(e)}"
        }), 500


@app.route('/search', methods=['POST', 'OPTIONS'])
def search_images():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    """
    Search for similar images
    Request body:
    {
        "image": "base64_string"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
        
        # Validate required fields
        if 'image' not in data:
            return jsonify({
                "success": False,
                "message": "'image' (base64) is required"
            }), 400
        
        base64_image = data['image']
        
        if not base64_image:
            return jsonify({
                "success": False,
                "message": "'image' cannot be empty"
            }), 400
        
        # Decode base64 to temporary file
        temp_file = None
        try:
            temp_file = decode_base64_image(base64_image)
            
            # Get embedding from image
            query_vector = get_image_embedding(temp_file)
            
            # Validate embedding dimension
            if len(query_vector) != VECTOR_DIMENSION:
                return jsonify({
                    "success": False,
                    "message": f"Invalid embedding dimension: {len(query_vector)}, expected {VECTOR_DIMENSION}"
                }), 500
            
            # Perform vector search in Elasticsearch
            # Using script_score query for cosine similarity
            # cosineSimilarity returns value from -1 to 1
            search_query = {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'vector') + 1.0",
                        "params": {
                            "query_vector": query_vector.tolist()
                        }
                    },
                    "min_score": MIN_COSINE_SIMILARITY + 1.0  # +1 because cosineSimilarity returns -1 to 1, we add 1 to make it 0 to 2
                }
            }
            
            # Execute search
            response = es.search(
                index=INDEX_NAME,
                body={
                    "size": 100,  # Get top 100 results
                    "query": search_query
                }
            )
            
            # Extract rig_ids from results
            rig_ids = []
            seen_rig_ids = set()
            
            for hit in response['hits']['hits']:
                # Calculate actual cosine similarity (subtract 1 from score)
                # score = cosineSimilarity + 1.0, so cosineSimilarity = score - 1.0
                cosine_score = hit['_score'] - 1.0
                
                # Only include if similarity >= threshold
                if cosine_score >= MIN_COSINE_SIMILARITY:
                    rig_id = hit['_source']['product_id']
                    
                    # Filter duplicates - keep only the highest similarity for each rig_id
                    if rig_id not in seen_rig_ids:
                        rig_ids.append({
                            "rig_id": rig_id,
                            "similarity": round(cosine_score, 4),
                            "elasticsearch_id": hit['_id']
                        })
                        seen_rig_ids.add(rig_id)
                    else:
                        # Update if this result has higher similarity
                        for i, existing in enumerate(rig_ids):
                            if existing['rig_id'] == rig_id and cosine_score > existing['similarity']:
                                rig_ids[i] = {
                                    "rig_id": rig_id,
                                    "similarity": round(cosine_score, 4),
                                    "elasticsearch_id": hit['_id']
                                }
                                break
            
            # Sort by similarity (descending)
            rig_ids.sort(key=lambda x: x['similarity'], reverse=True)
            
            return jsonify({
                "success": True,
                "message": f"Found {len(rig_ids)} unique rigs",
                "count": len(rig_ids),
                "rig_ids": rig_ids,
                "min_similarity": MIN_COSINE_SIMILARITY
            }), 200
            
        finally:
            # Clean up temporary file
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error searching images: {str(e)}"
        }), 500


@app.route('/delete', methods=['POST', 'OPTIONS'])
def delete_images_by_rig_id():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    """
    Delete all documents with a specific rig_id
    Request body:
    {
        "rig_id": "rig_123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
        
        # Validate required fields
        if 'rig_id' not in data:
            return jsonify({
                "success": False,
                "message": "'rig_id' is required"
            }), 400
        
        rig_id = str(data['rig_id'])
        
        if not rig_id:
            return jsonify({
                "success": False,
                "message": "'rig_id' cannot be empty"
            }), 400
        
        print(f"🗑️  Deleting all documents with rig_id: {rig_id}")
        
        # Search for all documents with this rig_id
        search_response = es.search(
            index=INDEX_NAME,
            body={
                "query": {
                    "term": {
                        "product_id": rig_id
                    }
                },
                "size": 1000  # Get up to 1000 documents
            }
        )
        
        hits = search_response['hits']['hits']
        total_found = search_response['hits']['total']['value']
        
        print(f"📊 Found {total_found} documents with rig_id: {rig_id}")
        
        if total_found == 0:
            return jsonify({
                "success": True,
                "message": f"No documents found with rig_id: {rig_id}",
                "deleted_count": 0
            }), 200
        
        # Delete all documents
        deleted_count = 0
        failed_count = 0
        errors = []
        
        for hit in hits:
            try:
                doc_id = hit['_id']
                es.delete(index=INDEX_NAME, id=doc_id)
                deleted_count += 1
                print(f"✅ Deleted document {doc_id} (rig_id: {rig_id})")
            except Exception as e:
                failed_count += 1
                error_msg = f"Failed to delete document {hit['_id']}: {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
        
        result = {
            "success": True,
            "message": f"Deleted {deleted_count} out of {total_found} documents",
            "deleted_count": deleted_count,
            "failed_count": failed_count,
            "total_found": total_found
        }
        
        if failed_count > 0:
            result["errors"] = errors
        
        print(f"📊 Deletion complete: {deleted_count} deleted, {failed_count} failed")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error deleting documents: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error deleting documents: {str(e)}"
        }), 500


if __name__ == '__main__':
    # Check Elasticsearch connection
    print(f"Connecting to Elasticsearch at {ES_URL}...")
    if not es.ping():
        print(f"❌ Error: Cannot connect to Elasticsearch at {ES_URL}")
        print("Please make sure Elasticsearch is running.")
        exit(1)
    print(f"✅ Connected to Elasticsearch at {ES_URL}")
    
    # Check if index exists
    if not es.indices.exists(index=INDEX_NAME):
        print(f"⚠️  Warning: Index '{INDEX_NAME}' does not exist.")
        print("Please run create_index.py first to create the index.")
    
    print(f"\n🚀 Starting Flask API server...")
    print(f"📡 Endpoints:")
    print(f"   - GET  /health - Health check")
    print(f"   - POST /index  - Index an image with rig_id")
    print(f"   - POST /search - Search for similar images")
    print(f"   - POST /delete - Delete all documents by rig_id")
    print(f"\n🌐 Server running on http://54.79.147.183:5211")
    
    app.run(host='0.0.0.0', port=5211, debug=True)

