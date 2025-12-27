import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || 'https://eigzciwonwrbvcnekajj.supabase.co'
const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY || 'sb_publishable_rcTZ-tXlZ-nmx-f0VGE-CA_5F6WoxHB'

const supabase = createClient(supabaseUrl, supabaseKey)

export default {
  /**
   * 获取或创建匿名用户
   */
  async getOrCreateAnonymousUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!user) {
        const { data, error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) throw signInError
        return data.user
      }
      
      return user
    } catch (error) {
      console.error('Get or create user error:', error)
      throw error
    }
  },

  /**
   * 上传备份文件到云端
   * @param {string} fileContent - 备份文件内容（JSON 字符串）
   * @param {string} fileName - 文件名，默认为 'latest.wtdb'
   * @returns {Promise<{success: boolean, path: string}>}
   */
  async uploadBackup(fileContent, fileName = 'latest.wtdb') {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/${fileName}`
      
      // 将字符串转换为 Blob
      const blob = new Blob([fileContent], { type: 'application/json' })
      
      const { data, error } = await supabase.storage
        .from('backups')
        .upload(filePath, blob, {
          contentType: 'application/json',
          upsert: true
        })
      
      if (error) throw error
      
      // 同时保存带时间戳的备份
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const timestampPath = `${user.id}/backup_${timestamp}.wtdb`
      await supabase.storage
        .from('backups')
        .upload(timestampPath, blob, {
          contentType: 'application/json'
        })
      
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  /**
   * 下载最新备份
   * @returns {Promise<string>} 备份文件内容（JSON 字符串）
   */
  async downloadLatestBackup() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/latest.wtdb`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filePath)
      
      if (error) throw error
      
      return await data.text()
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  },

  /**
   * 列出所有备份
   * @returns {Promise<Array>} 备份文件列表
   */
  async listBackups() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      
      const { data, error } = await supabase.storage
        .from('backups')
        .list(user.id)
      
      if (error) throw error
      
      return data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
    } catch (error) {
      console.error('List error:', error)
      throw error
    }
  },

  /**
   * 删除指定备份
   * @param {string} fileName - 文件名
   * @returns {Promise<{success: boolean}>}
   */
  async deleteBackup(fileName) {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/${fileName}`
      
      const { error } = await supabase.storage
        .from('backups')
        .remove([filePath])
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  },

  /**
   * 获取同步状态
   * @returns {Promise<{exists: boolean, lastModified?: string, size?: number}>}
   */
  async getSyncStatus() {
    try {
      const user = await this.getOrCreateAnonymousUser()
      const filePath = `${user.id}/latest.wtdb`
      
      const { data, error } = await supabase.storage
        .from('backups')
        .list(user.id, {
          limit: 100,
          search: 'latest.wtdb'
        })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const file = data.find(f => f.name === 'latest.wtdb')
        if (file) {
          return {
            exists: true,
            lastModified: file.updated_at || file.created_at,
            size: file.metadata?.size
          }
        }
      }
      
      return { exists: false }
    } catch (error) {
      console.error('Sync status error:', error)
      return { exists: false, error: error.message }
    }
  }
}
