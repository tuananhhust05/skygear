"""
Script to create Elasticsearch index for image search
Index structure:
- product_id: text/keyword field
- vector: dense_vector with 512 dimensions (float array)
"""

from elasticsearch import Elasticsearch
import sys

# Elasticsearch connection
ES_HOST = "localhost"
ES_PORT = 9200
ES_URL = f"http://{ES_HOST}:{ES_PORT}"

# Index configuration
INDEX_NAME = "image_search_index"
VECTOR_DIMENSION = 512


def create_elasticsearch_index():
    """
    Create Elasticsearch index with product_id and vector fields
    """
    try:
        # Connect to Elasticsearch
        es = Elasticsearch(
            [ES_URL],
            request_timeout=30,
            max_retries=10,
            retry_on_timeout=True
        )
        
        # Check if Elasticsearch is running
        if not es.ping():
            print(f"❌ Error: Cannot connect to Elasticsearch at {ES_URL}")
            print("Please make sure Elasticsearch is running.")
            sys.exit(1)
        
        print(f"✅ Connected to Elasticsearch at {ES_URL}")
        
        # Check if index already exists and delete it
        if es.indices.exists(index=INDEX_NAME):
            print(f"⚠️  Index '{INDEX_NAME}' already exists.")
            print(f"🗑️  Deleting existing index '{INDEX_NAME}'...")
            es.indices.delete(index=INDEX_NAME)
            print(f"✅ Deleted existing index '{INDEX_NAME}'")
        
        # Define index mapping
        # For Elasticsearch 8.x, use the updated k-NN configuration
        mapping = {
            "mappings": {
                "properties": {
                    "product_id": {
                        "type": "keyword"  # Use keyword for exact matching, or "text" for full-text search
                    },
                    "vector": {
                        "type": "dense_vector",
                        "dims": VECTOR_DIMENSION,
                        "index": True,  # Enable indexing for vector search
                        "similarity": "cosine"  # Use cosine similarity for vector search
                    }
                }
            },
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            }
        }
        
        # Create index
        # Elasticsearch Python client supports both 'body' and direct parameters
        es.indices.create(index=INDEX_NAME, body=mapping)
        print(f"✅ Successfully created index '{INDEX_NAME}'")
        print(f"   - product_id: keyword")
        print(f"   - vector: dense_vector ({VECTOR_DIMENSION} dimensions)")
        print(f"   - similarity: cosine")
        
        # Verify index was created
        if es.indices.exists(index=INDEX_NAME):
            # Get index info
            index_info = es.indices.get(index=INDEX_NAME)
            print(f"\n📊 Index information:")
            print(f"   - Name: {INDEX_NAME}")
            print(f"   - Settings: {index_info[INDEX_NAME]['settings']}")
            print(f"   - Mappings: {index_info[INDEX_NAME]['mappings']}")
        
    except Exception as e:
        print(f"❌ Error creating index: {str(e)}")
        sys.exit(1)


def test_index():
    """
    Test the index by inserting a sample document
    """
    try:
        es = Elasticsearch([ES_URL])
        
        if not es.indices.exists(index=INDEX_NAME):
            print(f"❌ Index '{INDEX_NAME}' does not exist. Please create it first.")
            return
        
        # Create a sample vector (512 zeros for testing)
        sample_vector = [0.0] * VECTOR_DIMENSION
        
        # Insert test document
        test_doc = {
            "product_id": "test_product_001",
            "vector": sample_vector
        }
        
        es.index(index=INDEX_NAME, id="test_001", document=test_doc)
        print(f"\n✅ Test document inserted successfully")
        print(f"   - product_id: test_product_001")
        print(f"   - vector: {len(sample_vector)} dimensions")
        
        # Retrieve the document
        result = es.get(index=INDEX_NAME, id="test_001")
        print(f"\n📄 Retrieved document:")
        print(f"   - ID: {result['_id']}")
        print(f"   - product_id: {result['_source']['product_id']}")
        print(f"   - vector length: {len(result['_source']['vector'])}")
        
        # Delete test document
        es.delete(index=INDEX_NAME, id="test_001")
        print(f"\n✅ Test document deleted")
        
    except Exception as e:
        print(f"❌ Error testing index: {str(e)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Elasticsearch Index Creator for Image Search")
    print("=" * 60)
    print(f"Target: {ES_URL}")
    print(f"Index Name: {INDEX_NAME}")
    print(f"Vector Dimension: {VECTOR_DIMENSION}")
    print("=" * 60)
    print()
    
    # Create index
    create_elasticsearch_index()
    
    # Test index
    print("\n" + "=" * 60)
    print("Testing Index")
    print("=" * 60)
    test_response = input("Do you want to test the index with a sample document? (yes/no): ")
    if test_response.lower() == 'yes':
        test_index()
    
    print("\n" + "=" * 60)
    print("✅ Done!")
    print("=" * 60)

