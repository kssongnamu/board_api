var express = require('express');
var router = express.Router();
const db = require('../db')
const Queries = require('./queries/posts')
const jwtModules = require('../modules/jwt-modules')

router.post('/', jwtModules.userAuthenticate, (req, res, next)=>{
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

router.get('/count', (req, res, next)=>{
    const sql = Queries.countPosts()

    const countPostsWork = async()=>{
        const con = await db.getConnection()
        const rows = await db.query(con, sql)
        con.release()
        return {result: rows[0]}
    }

    countPostsWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=>next(err))
})

router.get('/post', (req, res, next)=>{
    const params = req.query
    const sql = Queries.selectPost(params)

    const getPostWork = async()=>{
        const con = await db.getConnection()
        const rows = await db.query(con, sql)
        con.release()

        if (rows.length === 0){
            return {success: false, message: '게시글이 삭제 되거나 없습니다.'}
        }

        return {success: true, post: rows[0]}
    }

    getPostWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=>next(err))
})

router.put('/', jwtModules.userAuthenticate, (req, res, next)=>{
    const user = req.user
    const params = req.body
    const loginUserId = user.user_id
    const editUserId = Number(params.user_id)
    let sql

    const updatePostWork = async()=>{
        if (loginUserId !== editUserId) {
            return {success: false, message: '수정할 권한이 없습니다.'}
        }
        const con = await db.getConnection()
        await db.beginTransaction
        sql = Queries.updatePost(params)
        try{
            const updated = await db.query(con, sql)
            await db.commit(con)
            con.release()

            if (updated.affectedRows === 0) {
                return {success: false, message: '없는 게시글 이거나 삭제된 게시글 입니다.'}
            } else {
                return {success: true, message: '수정 되었습니다.'}
            }
        }catch(err) {
            await con.rollback()
            con.release()
            throw err
        }
    }

    updatePostWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=>next(err))
})

router.delete('/', jwtModules.userAuthenticate, (req, res, next)=>{
    const user = req.user
    const params = req.query
    const loginUserId = user.user_id
    const deleteUserId = Number(params.user_id)
    let sql

    const deletePostWork = async()=>{
        if (loginUserId !== deleteUserId) {
            return {success: false, message: '삭제할 권한이 없습니다.'}
        }
        const con = await db.getConnection()
        sql = Queries.deletePost(params)
        try{
            const deleted = await db.query(con, sql)
            await db.commit(con)
            con.release()

            if (deleted.affectedRows === 0) {
                return {success: false, message: '없는 게시글 이거나 이미 삭제된 게시글 입니다.'}
            } else {
                return {success: true, message: '삭제 되었습니다.'}
            }
        }catch(err){
            con.release()
            throw err
        }
    }

    deletePostWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))
})

module.exports = router;