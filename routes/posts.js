var express = require('express');
var router = express.Router();
const db = require('../db')
const Queries = require('./queries/posts')

router.get('/', (req, res, next)=>{
    const params = req.query
    const sql = Queries.selectPosts(params)
    
    const getPostsWork = async() =>{
         const con = await db.getConnection()
         const result = await db.query(con, sql)
         con.release()
         return {posts: result}
    }

    getPostsWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))
})


router.post('/', (req, res, next)=>{
    const params = req.body
    let sql
    
    const addPostWork = async()=>{
        const con = await db.getConnection()
        await db.beginTransaction(con)
        sql = Queries.insertPost(params)
        try{
            const inserted = await db.query(con, sql)
            await db.commit(con)
            con.release()
            return {post_id: inserted.insertId}
        }catch(err) {
            await con.rollback()
            con.release()
            throw err
        }
    }

    addPostWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))
        
})


module.exports = router;