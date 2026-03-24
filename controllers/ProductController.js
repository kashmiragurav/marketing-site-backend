const { getDB } = require("../db");

// CREATE Product
exports.createProduct = async (req, res) => {
  try {
    const db = getDB();
    const product = req.body;

    const result = await db.collection("products").insertOne(product);

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET All Products
exports.getProducts = async (req, res) => {
  try {
    const db = getDB();

    const products = await db.collection("products").find().toArray();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE Product
exports.updateProduct = async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const db = getDB();
    const id = req.params.id;

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const db = getDB();
    const id = req.params.id;

    const result = await db
      .collection("products")
      .deleteOne({ _id: new ObjectId(id) });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};