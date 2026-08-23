export interface CustomerTable {
  id: string
  label: string
}

export interface TableSession {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: string
  sessionId: string
  table: CustomerTable
}

export interface TableSessionResponse {
  data: TableSession
}
