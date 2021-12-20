const pug = require('pug');
const fs = require('fs')
const { Client } = require('pg')
const express = require('express');
const bodyParser = require('body-parser');

let app = express();
app.use(express.static("public"));
app.use(bodyParser.json({extended:true}))

const pgConnect = new Client({
    host: "localhost",
    user: "postgres",
    port: "5432",
    password: "abc",
    database: "3005-Final-DB"
})
pgConnect.connect(err => {
    if (err){console.log(err.stack)}
})

const renderHome = pug.compileFile('homepage.pug')
const renderCart = pug.compileFile('cart.pug')
const renderAuth = pug.compileFile('auth.pug')
const renderTrack = pug.compileFile('track.pug')
const renderReport = pug.compileFile('report.pug')
const renderSearch = pug.compileFile('search.pug')
const renderList = pug.compileFile('bookList.pug')
const renderBook = pug.compileFile('aBook.pug')

//this is not part of the database since it is temporary and can still be edited
cart = {}

signedIn = null

orderNum = 9

/*example query for reference

pgConnect.query('SELECT * FROM author', (err, res) =>{
    console.log(err ? err.stack : res.rows)
    console.log(typeof(res.rows[0]['name']))
})

*/


//main pages
app.get('/', function(req,response){
    response.send(renderHome())
});

app.get('/cart', function(req,response){
    response.send(renderCart({cart: cart}))
});

app.get('/auth', function(req,response){
    response.send(renderAuth({status: signedIn}))
});

app.get('/track', function(req,response){
    response.send(renderTrack())
});

app.get('/report', function(req,response){
    response.send(renderReport())
});

app.get('/search', function(req,response){
    response.send(renderSearch())
});

app.get('/books', function(req,response){
    pgConnect.query({text:'SELECT id, title, price, genre FROM book', rowMode: 'array'}, (err, res) =>{
        response.send(renderList({books:res.rows}))
    });
});

app.get('/books/:bookID', function(req,response){
    pgConnect.query('SELECT * FROM "book" JOIN "bookspecs" ON "book"."id"="bookspecs"."bookid"', (err, res) =>{
        for (book in res.rows){
            if (res.rows[book]['id'] == req.params.bookID){
                response.send(renderBook({book:res.rows[book]}))
                return
            }
        }
        response.sendStatus(404)
    });
});


//helper functions
app.get('/client.js', function(req,response){
    fs.readFile('client.js', function(err, data) {
        response.send(data)
    });
})

//JOIN shipping_info ON orderm.onum=shipping_info.id
app.get('/track/:ID', function(req, response){
    response.status(201)
    const query = `SELECT * 
                   FROM orderm 
                   JOIN sold_books ON orderm.onum=sold_books.onum
                   JOIN shipping_info ON orderm.shipid=shipping_info.id
                   JOIN book ON sold_books.bookid=book.id`;
    pgConnect.query(query, (err, res) => {
        for (order in res.rows){
            if(parseFloat(res.rows[order]['onum']).toFixed(0) == req.params.ID){
                response.status(200)
                response.send(JSON.stringify(res.rows[order]))
                return
            }
        }
        response.sendStatus(404)
    });
});

app.post('/order', function(req, response){
    if(req.body['id'] in cart){
        cart[req.body['id']] += 1  
    }
    else{
        cart[req.body['id']] = 1
    }
    response.sendStatus(201)
});

app.get('/info', function(req, response){
    pgConnect.query('SELECT username, password FROM customer', (err, res)=>{
        response.status = 200
        response.send(JSON.stringify({info: res.rows}))
    })
})

app.post('/register', function(req, response){
    const query = "INSERT INTO customer (username, password) VALUES ('" + req.body['username'] + "','" + req.body['password'] +"')"
    console.log(query)
    pgConnect.query(query, (err, res) => {
        if (err){
            console.log(err)
        }
    })
    response.sendStatus(201)
})

app.post('/login', function(req, response){
    signedIn = req.body['username']
    response.sendStatus(200)
})

app.get('/cartInfo', function(req, response){
    pgConnect.query('SELECT * FROM book', (err, res)=>{
        response.status(200)
        response.send(JSON.stringify({cart: cart, books: res.rows}))
    })
    
})

app.post('/purchase', function(req, response){
    query = "INSERT INTO shipping_info VALUES ('" + orderNum + "', '" + req.body['shipping']['address'] + "', '" + req.body['shipping']['postal'] + "', '" + req.body['shipping']['province'] + "', '" + req.body['shipping']['city'] +"')"
    pgConnect.query(query, (err, res) => {
        if (err){
            console.log(err)
        }
    })
    query = "INSERT INTO payment_info VALUES ('" + orderNum + "', '" + req.body['payment']['number'] + "', '" + req.body['payment']['cvv'] + "', '" + req.body['payment']['day'] + "', '" + req.body['payment']['month'] + "', '" + req.body['payment']['year'] +"')"
    pgConnect.query(query, (err, res) => {
        if (err){
            console.log(err)
        }
    })
    query = "INSERT INTO orderm VALUES ('" + orderNum + "', '" + req.body['order']['trucknum']  + "', '" + req.body['order']['facility']  + "', '" + req.body['order']['city']  + "', '" + req.body['order']['province']  + "', '" + signedIn + "', '" + orderNum   + "', '" + orderNum +"')"
    pgConnect.query(query, (err, res) => {
        if (err){
            console.log(err)
        }
    })
    for (item in cart){
        pgConnect.query("INSERT INTO sold_books VALUES ('" + orderNum + "', '" + item + "')", (err, res) => {
            if (err){
                console.log(err)
            }
        })
    }
    orderNum += 1
    response.sendStatus(201)
})

app.post('/result', function(req,response){
    if (req.body['type'].localeCompare('title') == 0){
        pgConnect.query("SELECT id, title, price, genre FROM book where book.title = '" + req.body['value'] + "'", (err, res) =>{
            response.status(200)
            response.send({books:res.rows})
        });
    }
    else if (req.body['type'].localeCompare('author') == 0){
        pgConnect.query("SELECT id, title, price, genre FROM book GROUP BY id having book.ID = (select bookid from bookspecs where authorname = '" + req.body['value'] + "')", (err, res) =>{
            response.status(200)
            response.send({books:res.rows})
        });
    }
    else if (req.body['type'].localeCompare('genre') == 0){
        pgConnect.query("SELECT id, title, price, genre FROM book where book.genre = '" + req.body['value'] + "'", (err, res) =>{
            response.status(200)
            response.send({books:res.rows})
        });
    }
    else if (req.body['type'].localeCompare('id') == 0){
        pgConnect.query("SELECT id, title, price, genre FROM book where book.id = '" + req.body['value'] + "'", (err, res) =>{
            response.status(200)
            response.send({books:res.rows})
        });
    }
});

app.listen(3000);
console.log("Server listening at http://localhost:3000");