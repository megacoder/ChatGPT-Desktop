import { configDir } from '@tauri-apps/api/path'
import Database from 'tauri-plugin-sql-api'
import { dialogErrorMessage } from '@/utils'
import type { HistoryRecord, RecordData } from '@/types'

const dbFile = import.meta.env.DEV ? 'sql.dev.db' : 'sql.db'
const db = await Database.load(
  `sqlite:${await configDir()}/${import.meta.env.VITE_APP_NAME}/${dbFile}`
)
const tableName = 'history'

/**
 * 执行 sql 语句
 * @param sql sql 语句
 */
export const executeSQL = async (sql: string) => {
  const sliceSQL = sql.slice(0, 6)

  try {
    if (sliceSQL === 'SELECT') {
      return await db.select(sql)
    } else {
      await db.execute(sql)
    }
  } catch (error) {
    let action = '创建'

    if (sliceSQL === 'SELECT') {
      action = '获取'
    } else if (sliceSQL === 'INSERT') {
      action = '添加'
    } else if (sliceSQL === 'UPDATE') {
      action = '更新'
    } else if (sliceSQL === 'DELETE') {
      action = '删除'
    }

    dialogErrorMessage(`${action}数据时遇到了问题，请重试~`)
  }
}

/**
 * 初始化 sql 配置
 */
export const initSQL = () => {
  executeSQL(
    `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, data TEXT, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
  )
}

/**
 * 查找的 sql 语句
 */
export const selectSQL = async () => {
  return (await executeSQL(
    `SELECT * FROM ${tableName} ORDER BY id;`
  )) as HistoryRecord[]
}

/**
 * 添加的 sql 语句
 * @param data 聊天内容
 */
export const insertSQL = async (data: RecordData[]) => {
  await executeSQL(
    `INSERT INTO ${tableName} (data) VALUES ('${JSON.stringify(data)}');`
  )
}

/**
 * 更新的 sql 语句
 * @param id 更新数据的 id
 * @param title 聊天内容标题
 */
export const updateSQL = async (id: number, payload: HistoryRecord) => {
  const updateParams: string[] = []

  for (const key in payload) {
    updateParams.push(`${key}='${payload[key as keyof typeof payload]}'`)
  }

  await executeSQL(
    `UPDATE ${tableName} SET ${updateParams.join()} WHERE id=${id};`
  )
}

/**
 * 删除的 sql 语句
 * @param id 删除数据的 id
 */
export const deleteSQL = async (id?: number) => {
  if (id) {
    await executeSQL(`DELETE FROM ${tableName} WHERE id=${id};`)
  } else {
    await executeSQL(`DELETE FROM ${tableName};`)
  }
}