import express from 'express';
import Listing from '../models/Listing.js';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Image Search API URL
const IMAGE_SEARCH_API_URL = process.env.IMAGE_SEARCH_API_URL || 'http://54.79.147.183:5211';

// Create new listing (seller submits rig)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      rigger,
      rigDetails,
      canopy,
      reserve,
      aad,
      pricing,
      delivery,
      images
    } = req.body;

    const listing = new Listing({
      seller: req.user._id,
      rigger,
      rigDetails,
      canopy,
      reserve,
      aad,
      pricing: {
        desiredPrice: pricing?.desiredPrice,
        fees: {
          riggerFee: 0,
          platformFee: 0,
          totalFees: 0
        }
      },
      delivery,
      images: images || {},
      status: 'pending'
    });

    await listing.save();
    await listing.populate('rigger', 'profile riggerInfo');

    // Index Full Rig View images to Elasticsearch (async, don't block response)
    if (images && images.fullRigView) {
      const fullRigViewImages = Array.isArray(images.fullRigView) 
        ? images.fullRigView 
        : [images.fullRigView];
      
      if (fullRigViewImages.length > 0) {
        console.log(`📸 Starting to index ${fullRigViewImages.length} Full Rig View images to Elasticsearch for listing ${listing._id}...`);
        console.log(`🔗 Image Search API URL: ${IMAGE_SEARCH_API_URL}`);
        
        // Process images asynchronously (don't block response)
        (async () => {
          try {
            const indexPromises = fullRigViewImages.map(async (imagePath, index) => {
              try {
                // Handle both relative and absolute paths
                let filePath;
                if (imagePath.startsWith('/uploads/')) {
                  // Relative path from root
                  filePath = path.join(__dirname, '..', imagePath);
                } else if (imagePath.startsWith('/')) {
                  // Absolute path starting with /
                  filePath = path.join(__dirname, '..', imagePath);
                } else {
                  // Assume it's already a full path or relative to uploads
                  filePath = path.join(__dirname, '../uploads', imagePath);
                }
                
                console.log(`🔄 Processing image ${index + 1}/${fullRigViewImages.length}: ${imagePath}`);
                console.log(`   Full path: ${filePath}`);
                
                // Check if file exists
                if (!fs.existsSync(filePath)) {
                  console.error(`❌ File not found: ${filePath}`);
                  return { success: false, index: index + 1, error: 'File not found' };
                }
                
                // Read file and convert to base64
                const fileBuffer = fs.readFileSync(filePath);
                const base64 = fileBuffer.toString('base64');
                console.log(`✅ Converted image ${index + 1} to base64. Size: ${(base64.length / 1024).toFixed(2)} KB`);
                console.log("base64: ", base64);
                // Call image search API
                const requestBody = {
                  image: base64,
                  rig_id: listing._id.toString()
                };
                
                console.log(`📤 Calling POST ${IMAGE_SEARCH_API_URL}/index with rig_id: ${listing._id}`);
                
                const response = await axios.post(`${IMAGE_SEARCH_API_URL}/index`, requestBody, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  timeout: 30000 // 30 seconds timeout
                });
                console.log("response: ", response);
                console.log(`✅ Successfully indexed image ${index + 1}:`, response.data);
                return { success: true, index: index + 1, data: response.data };
              } catch (error) {
                console.log("error: ", error);
                if (error.response) {
                  // The request was made and the server responded with a status code
                  // that falls out of the range of 2xx
                  console.error(`❌ Failed to index image ${index + 1}:`, error.response.status, error.response.data);
                  return { 
                    success: false, 
                    index: index + 1, 
                    error: error.response.data?.message || `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` 
                  };
                } else if (error.request) {
                  // The request was made but no response was received
                  console.error(`❌ No response from image search API for image ${index + 1}:`, error.message);
                  return { success: false, index: index + 1, error: 'No response from image search API' };
                } else {
                  // Something happened in setting up the request that triggered an Error
                  console.error(`❌ Error indexing image ${index + 1}:`, error.message);
                  return { success: false, index: index + 1, error: error.message };
                }
              }
            });
            
            const results = await Promise.allSettled(indexPromises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;
            
            console.log(`📊 Indexing complete for listing ${listing._id}: ${successful} successful, ${failed} failed out of ${results.length} images`);
            
            if (failed > 0) {
              console.warn(`⚠️ Some images failed to index for listing ${listing._id}. Check logs above for details.`);
            }
          } catch (error) {
            console.error(`❌ Error in image indexing process for listing ${listing._id}:`, error.message);
          }
        })();
      } else {
        console.log(`ℹ️ No Full Rig View images to index for listing ${listing._id}`);
      }
    }

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search listings by image
router.post('/search-by-image', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'Image (base64) is required' });
    }
    
    console.log('🔍 Searching listings by image...');
    
    // Call Flask API to search for similar images
    let searchResponse;
    try {
      searchResponse = await axios.post(`${IMAGE_SEARCH_API_URL}/search`, {
        image: image
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('✅ Image search API response:', searchResponse.data);
    } catch (error) {
      if (error.response) {
        console.error('❌ Image search API error:', error.response.status, error.response.data);
        return res.status(error.response.status).json({ 
          message: 'Image search failed', 
          error: error.response.data 
        });
      } else if (error.request) {
        console.error('❌ No response from image search API:', error.message);
        return res.status(503).json({ 
          message: 'Image search service unavailable' 
        });
      } else {
        console.error('❌ Error calling image search API:', error.message);
        return res.status(500).json({ 
          message: 'Image search error', 
          error: error.message 
        });
      }
    }
    
    // Extract rig_ids from search results
    const rigIds = searchResponse.data.rig_ids || [];
    
    if (rigIds.length === 0) {
      return res.json([]);
    }
    
    // Get rig_id values
    const rigIdValues = rigIds.map(item => item.rig_id);
    console.log(`📊 Found ${rigIdValues.length} rig_ids:`, rigIdValues);
    
    // Query listings by rig_ids
    const listings = await Listing.find({
      _id: { $in: rigIdValues },
      status: 'listed'
    })
      .populate('rigger', 'profile riggerInfo')
      .populate('seller', 'profile')
      .sort({ 'listingInfo.publishedAt': -1 });
    
    // Add similarity scores to listings
    const listingsWithSimilarity = listings.map(listing => {
      const rigIdStr = listing._id.toString();
      const searchResult = rigIds.find(item => item.rig_id === rigIdStr);
      
      return {
        ...listing.toObject(),
        imageSearchSimilarity: searchResult ? searchResult.similarity : null
      };
    });
    
    // Sort by similarity (highest first)
    listingsWithSimilarity.sort((a, b) => {
      if (a.imageSearchSimilarity && b.imageSearchSimilarity) {
        return b.imageSearchSimilarity - a.imageSearchSimilarity;
      }
      return 0;
    });
    
    console.log(`✅ Returning ${listingsWithSimilarity.length} listings`);
    
    res.json(listingsWithSimilarity);
  } catch (error) {
    console.error('❌ Error in search-by-image:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get all listings (public)
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      status, 
      limit, 
      featured, 
      seller, 
      rigger,
      manufacturer,
      model,
      size,
      serialNumber,
      jumpCount,
      year,
      price
    } = req.query;
    const query = { status: 'listed' };

    // Build $or array for general search (only for fields without specific filters)
    const searchOrConditions = [];
    if (search) {
      if (!manufacturer) {
        searchOrConditions.push({ 'rigDetails.manufacturer': { $regex: search, $options: 'i' } });
      }
      if (!model) {
        searchOrConditions.push({ 'rigDetails.model': { $regex: search, $options: 'i' } });
      }
      searchOrConditions.push(
        { 'canopy.manufacturer': { $regex: search, $options: 'i' } },
        { 'canopy.model': { $regex: search, $options: 'i' } },
        { 'listingInfo.title': { $regex: search, $options: 'i' } }
      );
    }

    // If we have search conditions, add $or to query
    if (searchOrConditions.length > 0) {
      query.$or = searchOrConditions;
    }

    // Specific filters (these take precedence over general search for the same field)
    if (manufacturer) {
      query['rigDetails.manufacturer'] = { $regex: manufacturer, $options: 'i' };
    }

    if (model) {
      query['rigDetails.model'] = { $regex: model, $options: 'i' };
    }

    if (size) {
      query['rigDetails.size'] = { $regex: size, $options: 'i' };
    }

    if (serialNumber) {
      query['rigDetails.serialNumber'] = { $regex: serialNumber, $options: 'i' };
    }

    if (jumpCount) {
      const jumpCountNum = parseInt(jumpCount);
      if (!isNaN(jumpCountNum)) {
        query['rigDetails.jumpCount'] = jumpCountNum;
      }
    }

    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        query['rigDetails.year'] = yearNum;
      }
    }

    if (price) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum)) {
        query['pricing.listingPrice'] = priceNum;
      }
    }

    if (seller) {
      query.seller = seller;
    }

    if (rigger) {
      query.rigger = rigger;
    }

    let listingsQuery = Listing.find(query)
      .populate('rigger', 'profile riggerInfo')
      .populate('seller', 'profile');

    // Featured listings: sort by views or most recent
    if (featured === 'true') {
      listingsQuery = listingsQuery.sort({ 'listingInfo.views': -1, 'listingInfo.publishedAt': -1 });
    } else {
      listingsQuery = listingsQuery.sort({ 'listingInfo.publishedAt': -1 });
    }

    if (limit) {
      listingsQuery = listingsQuery.limit(parseInt(limit));
    }

    const listings = await listingsQuery;

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('rigger', 'profile riggerInfo')
      .populate('seller', 'profile');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Increment views
    listing.listingInfo.views += 1;
    await listing.save();

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get seller's listings
router.get('/seller/mine', authenticate, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('rigger', 'profile riggerInfo')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update listing images
router.put('/:id/images', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { serialNumber, reservePackingSheet, fullRigView, additional } = req.body;

    if (serialNumber) listing.images.serialNumber = serialNumber;
    if (reservePackingSheet) listing.images.reservePackingSheet = reservePackingSheet;
    if (fullRigView) listing.images.fullRigView = fullRigView;
    if (additional) listing.images.additional = additional;

    await listing.save();

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete listing (only by seller)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Only seller can delete their own listing
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own listings' });
    }

    // Prevent deletion if listing is sold
    if (listing.status === 'sold') {
      return res.status(400).json({ message: 'Cannot delete a sold listing' });
    }

    const listingId = listing._id.toString();
    
    // Delete listing from database
    await listing.deleteOne();

    // Delete associated images from Elasticsearch (async, don't block response)
    console.log(`🗑️  Deleting Elasticsearch documents for listing ${listingId}...`);
    (async () => {
      try {
        const response = await axios.post(`${IMAGE_SEARCH_API_URL}/delete`, {
          rig_id: listingId
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 seconds timeout
        });
        
        console.log(`✅ Successfully deleted Elasticsearch documents for listing ${listingId}:`, response.data);
      } catch (error) {
        if (error.response) {
          console.error(`❌ Failed to delete Elasticsearch documents for listing ${listingId}:`, error.response.status, error.response.data);
        } else if (error.request) {
          console.error(`❌ No response from image search API when deleting documents for listing ${listingId}:`, error.message);
        } else {
          console.error(`❌ Error deleting Elasticsearch documents for listing ${listingId}:`, error.message);
        }
        // Don't fail the listing deletion if Elasticsearch deletion fails
      }
    })();

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

