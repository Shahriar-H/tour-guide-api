const express = require("express")
const cors = require("cors");
const connection = require("./config");
const { ObjectId } = require("mongodb");
const { v2:cloudinary } = require('cloudinary');
const { emailsender } = require("./send_email");

// Configuration
cloudinary.config({ 
    cloud_name: 'dqljmx6ai', 
    api_key: '445638554684912', 
    api_secret: 'UnO629-Pt3xR96MJFGXDhXmXikU' // Click 'View API Keys' above to copy your API secret
});


const app = express();

app.use(cors({
    origin: "*"
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Functions

const isFoundDuplicate = async ({ table, query }) => {
    const db = await connection();
    const result = await db.collection(table).find(query).toArray();
    // console.log(result, table, query);
    
    if (result?.length > 0) {
        // already exist
        return true;
    }
    // not found duplicate email or phone
    return false;
};
//functions

app.get("/",(req,res)=>{

    res.send("Started")

})


app.post("/insert-item", async (req, res) => {
    try {
        const { data, table } = req?.body;
        if (table === 'users') {
            // Await the isFoundDuplicate function
            const isDuplicate = await isFoundDuplicate({ query: {
                $or: [
                    { email: data?.email },
                    { phone: data?.phone }
                ]
            }, table });

            if (isDuplicate) {
                return res.send({ status: 203, message: "Email or Phone Already Exist" });
            }
        }

        const db = await connection();
        const result = await db.collection(table).insertOne({ ...data, created_at: new Date().getTime() });

        res.send({ status: 200, result, message: "Success!" });
    } catch (error) {
        res.send({ status: 500, error, message: "Not Inserted!" });
    }
});


app.post("/get-item",async (req,res)=>{

    try {
        const {table,query} = req?.body
        const db = await connection()
        const result = await db.collection(table).find(query).sort({"_id": -1}).toArray()

        return res.send({status:200,result,message:"Success!"})

    } catch (error) {
        return res.send({status:500,error,message:"Not Fetched!"})
    }
    
})


app.post("/delete-item",async (req,res)=>{

    try {
        const {table,query} = req?.body
        const db = await connection()
        let myQuery = query;
        if(query?.id){
            const theid = new ObjectId(query?.id)
            delete query['id']
            myQuery={...query,_id:theid}
        }
        const result = await db.collection(table).deleteOne(myQuery);
        console.log(result,myQuery);
        
        res.send({status:200,result,message:"Success!"})

    } catch (error) {
        res.send({status:500,error,message:"Not Deleted!"})
    }
    
})


app.post("/update-item",async (req,res)=>{

    try {
        const {data,table,id} = req?.body
        const db = await connection()
        const objId = new ObjectId(id)
        const result = await db.collection(table).updateOne(
            { _id:objId },          // Filter
            { $set: { ...data } }       // Update
          );

        res.send({status:200,result,message:"Success!"})

    } catch (error) {
        res.send({status:500,error,message:"Not Fetched!"})
    }
    
})

app.post("/upload-image",async (req,res)=>{
    const data = req?.files
    console.log(data);
    
    // try {
    //     (async function() {

        
    //         // Upload an image
    //          const uploadResult = await cloudinary.uploader
    //            .upload(
    //             image, {
    //                    public_id: 'shoes',
    //                }
    //            )
    //            .catch((error) => {
    //                console.log(error);
    //            });
            
    //         console.log(uploadResult);
            
    //         // Optimize delivery by resizing and applying auto-format and auto-quality
    //         const optimizeUrl = cloudinary.url('shoes', {
    //             fetch_format: 'auto',
    //             quality: 'auto'
    //         });
            
    //         console.log(optimizeUrl);
            
    //         // Transform the image: auto-crop to square aspect_ratio
    //         const autoCropUrl = cloudinary.url('shoes', {
    //             crop: 'auto',
    //             gravity: 'auto',
    //             width: 500,
    //             height: 500,
    //         });
            
    //         console.log(autoCropUrl);    
    //     })();
    //     // const {data,table} = req?.body
    //     // if(table==='users'){
    //     //     if(isFoundDuplicate({query:{email:data?.email,phone:data?.phone},table})){
    //     //         return res.send({status:203,message:"Email or Phone Already Exist"})
    //     //     }
    //     // }
    //     // const db = await connection()
    //     // const result = await db.collection(table).insertOne({...data, created_at:new Date().getTime()});

    //     // res.send({status:200,result,message:"Success!"})

    // } catch (error) {
    //     res.send({status:500,error,message:"Not Inserted!"})
    // }
    

})

app.post("/sendemail",async (req,res)=>{
    const data = req?.body
   
    //{email,message,subject}
    emailsender(data).catch((err)=>{
        console.log(err);
        
        return res.send({status:500,error:err})
    })
    return res.send({status:200})
})



app.listen(4430,"0.0.0.0",()=>{
    console.log("Server Started");
    
})