import pg from 'pg'
const { Pool } = pg;

const pool=new Pool({
    host:process.env.DB_HOST || 'localhost',
    port:process.env.DB_PORT || 5432,
    database:process.env.DB_USER || 'Devmetrics',
    user:process.env.DB_USER || 'postgres',
    password:process.env.DB_PASSWORD || 'Hars@08',
    max:20,
    idleTimeoutMillis:3000,
    connectionTimeoutMillis:2000,
});

pool.on('connect',()=>{
    console.log("connected to PostgressSQL")
})

pool.on('error',(err)=>{
    console.log("failed to make connection", err)
    process.exit(-1);
})

export const query=async (text, param)=>{
    const res=await pool.query(text,param)
    return res;
}

export default pool;