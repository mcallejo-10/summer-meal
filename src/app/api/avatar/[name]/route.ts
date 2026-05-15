import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const filePath = path.join(process.cwd(), 'public', 'avatars', `${name}.jpeg`)

  const exists = fs.existsSync(filePath)
  const avatarPath = exists ? `/avatars/${name}.jpeg` : '/avatars/default.jpeg'

  return NextResponse.redirect(new URL(avatarPath, request.url))
}
