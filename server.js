const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
var http = require("http");
var bodyParser = require("body-parser");


const app = express();

app.use(bodyParser.json({ limit: "50gb", type: "application/json" }));

const storage = multer.diskStorage({
	destination: "upload/",
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const filename = path.basename(file.originalname, ext);
		cb(null, `${filename}${ext}`);
	},
});

const upload = multer({ storage });

app.use(express.static("public"));

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/download/:filename", (req, res) => {
	const file = path.join(__dirname, "upload", req.params.filename);
	res.download(file, (err) => {
		if (err) {
			console.error(err);
			return res.status(404).send("File not found");
		}
	});
});

app.post("/comments", (req, res) => {
	// Get comment data from request body
	const { name, comment } = req.body;
	console.log(req.body);
	// Create a new comment object with a unique ID
	const newComment = {
		id: Date.now(),
		name: name,
		comment: comment,
	};

	// Save the new comment to a JSON file
	fs.readFile("comments.json", (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Failed to read comments file");
		}
		let comments = JSON.parse(data);
		comments.push(newComment);
		fs.writeFile("comments.json", JSON.stringify(comments), (err) => {
			if (err) {
				console.error(err);
				return res.status(500).send("Failed to write comments file");
			}

			res.status(201).json(newComment);
		});
	});
});

app.get("/comments", (req, res) => {
	fs.readFile("comments.json", (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Failed to read comments file");
		}

		const comments = JSON.parse(data);
		res.json(comments);
	});
});

app.delete("/comments/:id", (req, res) => {
	const commentId = parseInt(req.params.id);

	fs.readFile("comments.json", (err, data) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Failed to read comments file");
		}

		const comments = JSON.parse(data);
		const filteredComments = comments.filter(
			(comment) => comment.id !== commentId
		);

		fs.writeFile("comments.json", JSON.stringify(filteredComments), (err) => {
			if (err) {
				console.error(err);
				return res.status(500).send("Failed to write comments file");
			}

			res.sendStatus(204);
		});
	});
});

var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
//httpsServer.listen(443);
console.log('Server at : http://localhost is running..')