import express from 'express';

const app = express();

const port = 3000 || process.env.PORT;

app.get('/', (req, res) => {  
    res.send("<h1>Hello Dear</h1>")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});