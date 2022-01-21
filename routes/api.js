const express = require('express');
const app = express.Router();
const con = require('../config/database');

//TEST API
app.get('/', (req, res) => {
    res.send('Hello World!');
});

//API to create category
app.post('/addcategory', (req, res) => {
    if(!(req.body.name && req.body.description && req.body.image)){
        return res.status(400).send("Please enter name, description and image")
    }
    let data = {
        name: req.body.name,
        description: req.body.description,
        image_url: req.body.image,
        parent_category_id: req.body.mastercategory,
        slug: req.body.name
    }

    con.query('INSERT into categories SET ?', data, (err, success) => {
        if(err) {
            console.log(err);
            if(err.errno == 1062){
                return res.status(400).send("Category with name "+ req.body.name + " already exists");
            }
            return res.status(400).send("Error. Please try again later");
        }

        return res.send("Category added successfully with ID "+ success.insertId)
    })

});

//API to update category
app.post('/updatecategory', (req, res) => {
    if(!(req.body.name && req.body.description && req.body.image)){
        return res.status(400).send("Please enter name, description and image")
    }
    let data = {
        description: req.body.description,
        image_url: req.body.image
    }

    con.query('UPDATE categories SET ? WHERE name = ?', [data, req.body.name], (err, success) => {
        if(err) {
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        }
        console.log(success)
        return res.send("Category updated successfully")
    })

});

//GET API RETURN ALL Category
app.get('/getcategory', (req, res) => {

    con.query('SELECT * FROM categories', (err, data) => {
        if(err){
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        }

        if(data.length == 0){
            return res.send("No category found");
        }

        return res.send(data)
    });
});

//API to create product
app.post('/addproduct', (req, res) => {
    if(!(req.body.sku && req.body.price && req.body.name && req.body.image && req.body.category)){
        return res.status(400).send("Please enter name, price, image, sku and category")
    }
    let productData = {
        name: req.body.name,
        price: req.body.price,
        sku: req.body.sku,
        slug: req.body.name
    }
    con.beginTransaction((err) => {
        if(err) {return res.status(400).send("Error. Please try again later");}

        con.query("SELECT id FROM categories WHERE name = '" + req.body.category + "'", (err, id) => {
            if(err) {
                console.log(err);
                con.rollback(() => {
                    return res.status(400).send("Error. Please try again later");
                  });
            } else {
                if(id.length == 0){
                    con.rollback(() => {
                        return res.status(400).send("category " + req.body.category + " not found");
                      });
                } else {
                    let cat_id = id[0].id;
    
                    con.query("INSERT INTO products SET ?", productData, (err, success) => {
                        if(err) {
                            console.log(err);
                            con.rollback(() => {
                                return res.status(400).send("Error. Please try again later");
                            });
                        } else {
                            let productId = success.insertId;
            
                            let prod_cat = {
                                product_id: productId,
                                category_id: cat_id
                            }
                
                            con.query("INSERT INTO product_categories SET ?", prod_cat, (err, result) =>{
                                if(err) {
                                    console.log(err);
                                    con.rollback(() => {
                                        return res.status(400).send("Error. Please try again later");
                                    });
                                } else {
                                    let prod_image = {
                                        product_id: productId,
                                        image_url: req.body.image
                                    }
                
                                    con.query("INSERT INTO product_images SET ?", prod_image, (err, inserted) => {
                                        if(err) {
                                            console.log(err);
                                            con.rollback(() => {
                                                return res.status(400).send("Error. Please try again later");
                                            });
                                        } else {
                                            con.commit((err) => {
                                                if(err){
                                                    console.log(err);
                                                    con.rollback(() => {
                                                        return res.status(400).send("Error. Please try again later");
                                                    });
                                                } else {
                                                    return res.send("Product added successfully with ID "+ productId)
                                                }
                                            })
                                        }
                                    })
                                }  
                            })
                        }
                    })
                }
            }
        })
    })
});

//GET API RETURN ALL Products
app.get('/getproducts', (req, res) => {

    con.query('SELECT * FROM products', (err, data) => {
        if(err){
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        }

        if(data.length == 0){
            return res.send("No product found");
        }

        return res.send(data)
    });
});

//API to update product
app.post('/updateproduct', (req, res) => {
    if(!(req.body.name && req.body.price && req.body.image)){
        return res.status(400).send("Please enter name, price and image")
    }
    let data = {
        price: req.body.price,
    }

    con.query("SELECT id FROM products WHERE name = ?",req.body.name, (err, id) => {
        if(err) {
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        } else {
            if(!id || id.length == 0) {
                // console.log("NO id", id)
                return res.status(400).send("Error. Please try again later");
            } else {
                con.beginTransaction((err) => {
                    if(err) {return res.status(400).send("Error. Please try again later");}

                    con.query('UPDATE products SET ? WHERE id = ?', [data, id[0].id], (err, success) => {
                        if(err) {
                            console.log(err);
                            con.rollback(() => {
                                return res.status(400).send("Error. Please try again later");
                            });
                        } else {
                            con.query('UPDATE product_images SET ? WHERE product_id = ?', [{image_url:req.body.image}, id[0].id], (err, success) => {
                                if(err) {
                                    console.log(err);
                                    con.rollback(() => {
                                        return res.status(400).send("Error. Please try again later");
                                    });
                                } else {
                                    con.commit((err) => {
                                        if(err){
                                            console.log(err);
                                            con.rollback(() => {
                                                return res.status(400).send("Error. Please try again later");
                                            });
                                        } else {
                                            return res.status(200).send("Product updated successfully")
                                        }
                                    })
                                }
                            })
                        }
                    })
                })
                
            }
        }
    });
});

//GET API Products by ID
app.get('/getproduct/:id', (req, res) => {

    con.query('SELECT products.name, products.sku, products.price, products.price, products.slug, product_images.image_url FROM products '+ 
            'INNER JOIN product_images ON products.id = product_images.product_id where id = ?', req.params.id, (err, data) => {
        if(err){
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        }

        if(data.length == 0){
            return res.send("No product found");
        }

        return res.send(data)
    });
});

app.get("/getcategoryandproduct", (req, res) => {
    con.query("SELECT product_categories.product_id, product_categories.category_id, products.sku, products.name, products.price," +
    " categories.name AS category_name, categories.parent_category_id AS parent, product_images.image_url FROM products JOIN product_categories "+
    "ON product_categories.product_id = products.id JOIN categories ON categories.id = product_categories.category_id JOIN product_images ON "+
    "products.id = product_images.product_id ORDER BY parent",(err, categories) => {
        if(err){
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        } else {
            res.send(categories)
        }
    })
})

//POST API to get Products by name
app.post('/searchproduct', (req, res) => {

    con.query('SELECT products.name, products.sku, products.price, products.price, products.slug, product_images.image_url FROM products '+ 
    'INNER JOIN product_images ON products.id = product_images.product_id where products.name = ?', req.body.name, (err, data) => {
        if(err){
            console.log(err);

            return res.status(400).send("Error. Please try again later");
        }

        if(data.length == 0){
            return res.send("No product found");
        }

        return res.send(data)
    });
});

module.exports = app;

