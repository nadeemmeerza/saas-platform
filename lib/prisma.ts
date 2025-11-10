import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if Prisma client is available
function createPrismaClient() {
  try {
    // Try to create a new Prisma client
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('❌ Failed to create Prisma client:', error)
    
    // Return a mock client for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using mock Prisma client for development')
      return createMockPrismaClient()
    }
    
    throw error
  }
}

// Mock Prisma client for development when real one fails
function createMockPrismaClient(): any {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve()
      }
      if (prop === '$transaction') {
        return (operations: any) => Promise.resolve(operations)
      }
      // Return mock functions for all Prisma models
      return () => Promise.resolve(null)
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}