const express = require("express");
const app = express();
const fs = require("fs");
const session = require("express-session");
const cookie = require("cookie-parser");
let blogId=1;
let userId=1;
// Middleware setup
app.use(cookie());
app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: "abc"
}));
const multer = require("multer");
const upload = multer({ dest: __dirname + "/public" });
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/files"));
app.set("view engine", "ejs");

// Middleware for authentication
function auth(req, res, next) {
    console.log(req.session.obj);
    if (req.session.obj)
        next();
    else
        res.redirect("/login");
}

function auth1(req, res, next) {
    if (req.session.obj){
        if(req.session.obj.role=="admin")
        next();
    else{
        res.redirect("/dashboard");
    }
    }
    else
        res.redirect("/login");
}

// Routes
app.get("/login", (req, res) => {
    if (req.session.obj) {
        if(res.session.obj.role="admin")
        res.redirect("/");
    else
    res.redirect("/dashboard");
    }
    else{
    res.render("login", { message: "" });
    }
});

app.get("/signup", (req, res) => {
    if (req.session.obj) {
        res.redirect("/login");
        return;
    }
    res.render("signup");
});

app.get("/bloggs", auth1, (req, res) => {
    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        data = JSON.parse(data);
        res.render("bloggs", { name: req.session.obj, bloggs: data });
    });
});
app.get("/authors", auth1, (req, res) => {
    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        data = JSON.parse(data);
        let result=data.filter(ele=>ele.role !== "admin")
        res.render("authors", { authors: result });
    });
});
app.get("/mybloggs", auth, (req, res) => {
    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        data = JSON.parse(data);
        console.log(req.session.obj);
        let result = data.filter(ele => ele.name === req.session.obj.username);
        res.render("mybloggs", { bloggs: result });
    });
});
app.get("/", auth1, (req, res) => {
    if (!req.session.obj) {
        res.redirect("/login");
        return;
    }
    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        data = JSON.parse(data);
        res.render("AdminDASHBOARD", { name: req.session.obj, product: data });
    });
});
app.get("/dashboard", auth, (req, res) => {
    if (!req.session.obj) {
        res.redirect("/login");
        return;
    }
    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        data = JSON.parse(data);
        res.render("UserDASHBOARD", { name: req.session.obj, product: data });
    });
});
app.post("/log", (req, res) => {
    let { username, pass } = req.body;
    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error");
        }
        data = JSON.parse(data);
        let result = data.filter(ele => ele.username == username && ele.pass == pass);
        if (result.length > 0) {
            req.session.obj = result[0];
            if (req.session.obj.role == "admin")
                res.redirect("/");
            else
                res.redirect("/dashboard");
        } else {
            res.render("login", { message: "credentials not matched" });
        }
    });
});
app.post("/signup",upload.single("pic"), (req, res) => {
    let { username, pass, age, address } = req.body;
    let pic = req.file ? req.file.filename : "";
    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error");
        }
        data = JSON.parse(data);
        let flag = data.some(ele => ele.username == username && ele.pass == pass);
        if (flag) {
            res.send("User already exists");
        } else {
            let obj = {
                username: username,
                pass: pass,
                age: age,
                address: address,
                userId: userId,
                pic: pic,
                role: "user"
            };
            userId=userId+1;
            data.push(obj);
            fs.writeFile(__dirname + "/user.json", JSON.stringify(data), (err) => {
                res.redirect("/login");
            });
        }
    });
});

app.get("/addBloggs",auth, (req, res) => {
    if (!req.session.obj) {
        res.redirect("/login");
        return;
    }
    res.render("addBloggs");
});

app.post("/add",auth, upload.single("pic"), (req, res) => {
    let { topic, desc } = req.body;
    let pic = req.file ? req.file.filename : "";
    fs.readFile(__dirname+"/product.json", "utf-8", (err, data) => {
        if (err) {
            return res.status(500).send('Error');
        }
        data = JSON.parse(data);
        let flag=false;
            data.forEach(element => {
                if(element.topic==topic&&element.desc==desc){
                    flag=true;
                }
                
            });
            console.log(flag);
            if(flag){
                res.send("exist"); 
                return;
            }
            let object={ 
                name: req.session.obj.username,
                 topic: topic, 
                 desc: desc, 
                 pic: pic,
                 blogid:blogId
                };
                blogId=blogId+1;
        data.push(object);
        fs.writeFile(__dirname+"/product.json", JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
                return;
            }
            if(req.session.obj.role=="admin")
            res.redirect("/"); 
        else
        res.redirect("/dashboard");
        });
    });
});
app.get("/deleteUser/:userId", (req, res) => {
    const userId = req.params.userId;
    fs.readFile(__dirname+"/user.json","utf-8",(err,data)=>{
        if(err){
            console.log(err);
            return;
        }
        data=JSON.parse(data);
         let data1=data.filter(ele=>{
         return   ele.userId!=userId});
         fs.writeFile(__dirname+"/user.json", JSON.stringify(data1), (err) => {
         if (err) {
            console.log(err);
            return res.status(500).send(" Error");
        }
        if(req.session.obj.role=="admin")
        res.redirect("/");
    
    });
})
});
app.get("/deleteBlog/:blogid", (req, res) => {
    const blogid = req.params.blogid;
    fs.readFile(__dirname+"/product.json","utf-8",(err,data)=>{
        if(err){
            console.log(err);
            return;
        }
        data=JSON.parse(data);
         let data1=data.filter(ele=>{
         return   ele.blogid!=blogid});
         fs.writeFile(__dirname+"/product.json", JSON.stringify(data1), (err) => {
         if (err) {
            console.log(err);
            return res.status(500).send(" Error");
        }
        if(req.session.obj.role=="admin")
        res.redirect("/");
    else{
        res.redirect("/dashboard");
    }
    });
})
});
app.get("/updateUser/:userId",auth1, (req, res) => {
    const userId = req.params.userId;
    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error reading file");
        }
        data = JSON.parse(data);
        const userToUpdate = data.find(user => user.userId == userId);
        if (!userToUpdate) {
            return res.status(404).send("user not found");
        }
        res.render("updateUser", { ele: userToUpdate });
    });
});

// Route to handle update request for a specific blog
app.post("/updateUser",auth1,(req, res) => {
    let { username, pass, age, address, userId } = req.body;

    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error reading file");
        }
         data = JSON.parse(data);
        const index = data.findIndex(user => user.userId == userId);
        console.log(index);
        if (index === -1) {
            return res.status(404).send("user not found");
        }
        data[index].username = username;
        data[index].pass = pass;
        data[index].age = age;
        data[index].address = address;
        fs.writeFile(__dirname + "/user.json", JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error writing file");
            }
            res.redirect("/authors");
        });
    });
});
app.get("/updateBlog/:blogId",auth, (req, res) => {
    const blogId = req.params.blogId;
    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error reading file");
        }
        data = JSON.parse(data);
        const blogToUpdate = data.find(blog => blog.blogid == blogId);
        if (!blogToUpdate) {
            return res.status(404).send("Blog not found");
        }
        res.render("updateBlog", { ele: blogToUpdate });
    });
});

// Route to handle update request for a specific blog
app.post("/update",auth,(req, res) => {
    let { topic, desc, blogId } = req.body;
    console.log(blogId,desc);
    console.log(req.body.topic);

    fs.readFile(__dirname + "/product.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error reading file");
        }
         data = JSON.parse(data);
        const index = data.findIndex(blog => blog.blogid == blogId);
        console.log(index);
        if (index === -1) {
            return res.status(404).send("Blog not found");
        }
        data[index].topic = topic;
        data[index].desc = desc;
        fs.writeFile(__dirname + "/product.json", JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error writing file");
            }
            if(req.session.obj.role=="admin")
        res.redirect("/");
       else{
        res.redirect("/dashboard");
    }
        });
    });
});
app.get("/addUser",auth1, (req, res) => {
    if (req.session.obj=="admin") {
        res.redirect("/authors");
        return;
    }
    res.render("addUser");
});
app.post("/addUser",upload.single("pic"), (req, res) => {
    let { username, pass, age, address } = req.body;
    let pic = req.file ? req.file.filename : "";
    fs.readFile(__dirname + "/user.json", "utf-8", (err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error");
        }
        data = JSON.parse(data);
        let flag = data.some(ele => ele.username == username && ele.pass == pass);
        if (flag) {
            res.send("User already exists");
        } else {
            let obj = {
                username: username,
                pass: pass,
                age: age,
                address: address,
                userId: userId,
                pic: pic,
                role: "user"
            };
            userId=userId+1;
            data.push(obj);
            fs.writeFile(__dirname + "/user.json", JSON.stringify(data), (err) => {
                res.redirect("/authors");
            });
        }
    });
});
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.listen(3000, (err) => {
    if (err) {
        console.log("Error starting server:", err);
    } else {
        console.log("Server started at port 3000");
    }
});
// const express=require("express");

// const app=express();

// const session=require("express-session");

// const multer=require("multer");

// const abc=multer.diskStorage({

//     destination:(req,file,cb)=>{

// if(file.mimetype.split("/")[1]=="jpg"){

//         cb(null,__dirname+"/public/jpg");}

// else{

// cb(null,__dirname+"/public");}

//     },filename:(req,file,cb)=>{

//         cb(null,Date.now()+file.mimetype.split("/")[1]);

//     }

// })



// const filter=(req,file,cb)=>{

//     if(file.mimetype.split("/")[1]=="jpg"||file.mimetype.split("/")[1]=="jpeg"||file.mimetype.split("/")[1]=="png")

//         cb(null,true)

//     else

//     cb(new Error("not supported"),false)

// }





// const upload=multer({storage:abc,fileFilter:filter,limits:{fieldSize:2*1024*1024}})
