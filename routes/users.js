var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
const db = require('../db')
const Queries = require('./queries/users')
const jwtModules = require('../modules/jwt-modules')

router.post('/', (req, res, next)=>{
    const params = req.body
    let sql
    
    const addUserWork = async()=>{
        const con = await db.getConnection()
        await db.beginTransaction(con)
        sql = Queries.insertUser(params)
        try{
            const inserted = await db.query(con, sql)
            await db.commit(con)
            con.release()
            return {user_id: inserted.insertId}
        }catch(err) {
            await con.rollback()
            con.release()
            throw err
        }
    }

    addUserWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))
        
})

router.get('/', (req, res, next)=>{
    const params = req.query
    let sql

    const getUserWork = async()=>{
        const con = await db.getConnection()
        sql = Queries.selectUser(params)
        const rows = await db.query(con, sql)        
        con.release()         
        
        if(rows.length == 0){
            return {success: false, message: '등록되지 않은 사용자 입니다. 아이디와 비밀번호를 확인해 주세요'}
        }
        
        let findUser = JSON.parse(JSON.stringify(rows[0]))
        const token = jwt.sign(findUser, jwtModules.secretKey, { expiresIn: '30s' })    
        findUser.token = token
        return {success: true, result: findUser}

    }

    getUserWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))

})

router.delete('/', jwtModules.userAuthenticate, (req, res, next)=>{
    const params = req.query
    let sql

    const deleteUserWork = async()=>{
        const con = await db.getConnection()
        sql = Queries.deleteUser(params)
        try{
            const deleted = await db.query(con, sql)
            await db.commit(con)
            con.release()

            if (deleted.affectedRows === 0) {
                return {success: false, message: '없는 사용자 이거나 이미 삭제된 사용자 입니다.'}
            } else {
                return {success: true, message: '삭제 되었습니다.'}
            }
        }catch(err){
            con.release()
            throw err
        }
    }

    deleteUserWork()
    .then(result=>{
        res.status(200).send(result)
    })
    .catch(err=> next(err))
})

module.exports = router;