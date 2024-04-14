const { Server } = require("socket.io");
const express = require('express')
const { createServer } = require("http");
const cors = require('cors');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/text-editor', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const schema = mongoose.Schema;

const documentSchema = new schema({
    _id: String,
    data : Object
});

const Document = mongoose.model('Document', documentSchema);

const app = express();
app.use(cors())
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://127.0.0.1:5173"
    }
});
const port = 3001

io.on("connection", (socket) => {
    console.log("socket id", socket.id)
    socket.on("get-document", async (documentId) => {
        const document = await findOrCreate(documentId)
        socket.join(documentId);
        socket.emit("load-document", document.data )
        socket.on("send-changes", (delta) => {
            socket.broadcast.to(documentId).emit("receive-changes", delta);
            console.log(delta);
        })
        socket.on("save-data", async (data) => {
            await Document.findByIdAndUpdate(documentId, {data})
        })
    })
});


async function findOrCreate(id){
    if(id == null)return
    const result = await Document.findById(id);
    if(result) return result
    else{
        return await Document.create({
            _id : id,
            data: {}
        })
    }
}


httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});