const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const app = express();
const { Parser } = require('json2csv');
app.use(express.static('css'));
app.use(express.static('images'));
app.use(express.static(path.join(__dirname, '../views')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'main.html'));
});


app.get('/books', (req, res) => {
  const { genre, author, title, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM Book WHERE 1=1';

  if (genre) {
    sql += ` AND Genre = '${genre}'`;
  }

  if (author) {
    sql += ` AND Author LIKE '%${author}%'`;
  }

  if (title) {
    sql += ` AND Title LIKE '%${title}%'`;
  }

  if (startDate && endDate) {
    sql += ` AND PublicationDate BETWEEN '${startDate}' AND '${endDate}'`;
  }

  db.query(sql, (err, books) => {
    if (err) {
      console.error('Error fetching books:', err);
      res.status(500).send('Error fetching books');
    } else {
      res.json(books);  
    }
  });
});


app.post('/add-book', (req, res) => {
  const { Title, Author, Genre, PublicationDate, ISBN } = req.body;

  const sql = `INSERT INTO Book (Title, Author, Genre, PublicationDate, ISBN)
               VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [Title, Author, Genre, PublicationDate, ISBN], (err, result) => {
    if (err) {
      console.error('Error adding book:', err);
      res.status(500).send({ error: 'Failed to add book' });
    } else {
      res.status(201).send({ message: 'Book added successfully', book: req.body });
    }
  });
});


app.get('/genres', (req, res) => {
  const sql = 'SELECT DISTINCT Genre FROM Inventory';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching genres:', err);
      res.status(500).send('Error fetching genres');
    } else {
      const genres = results.map(row => row.Genre);  
      res.json(genres); 
    }
  });
});


app.get('/export/json', (req, res) => {
  const sql = 'SELECT * FROM Book';
  
  db.query(sql, (err, books) => {
    if (err) {
      return res.status(500).send('Error fetching books');
    }
    res.setHeader('Content-disposition', 'attachment; filename=books.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(books, null, 2)); 
  });
});

app.get('/export/csv', (req, res) => {
  const sql = 'SELECT * FROM Book';

  db.query(sql, (err, books) => {
    if (err) {
      return res.status(500).send('Error fetching books');
    }
    const fields = ['Title', 'Author', 'Genre', 'PublicationDate', 'ISBN'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(books);

    res.setHeader('Content-disposition', 'attachment; filename=books.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  });
});
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
