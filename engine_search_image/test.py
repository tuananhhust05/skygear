import clip
import torch
from PIL import Image
import numpy as np

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load model
model, preprocess = clip.load("ViT-B/32", device=device)

def get_embedding(image_path):
    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model.encode_image(image)
        embedding /= embedding.norm(dim=-1, keepdim=True)  # Normalize
    return embedding.cpu().numpy()


def cosine_similarity(vec1, vec2):
    """
    Tính cosine similarity giữa 2 vector vec1 và vec2.
    Trả về giá trị từ -1 đến 1.
    """
    vec1 = np.array(vec1).flatten()
    vec2 = np.array(vec2).flatten()
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0  # Tránh chia cho 0
    
    return dot_product / (norm1 * norm2)


embedding1 = get_embedding("image.jpg")
embedding2 = get_embedding("image2.png")

print("Embedding 1: ", embedding1)
print("Embedding 2: ", embedding2)

print("Cosine similarity: ", cosine_similarity(embedding1, embedding2))