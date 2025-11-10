// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/auth-utils';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['USER', 'ADMIN']),
  sendInvite: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    const body = await request.json();
    const { name, email, role, sendInvite } = createUserSchema.parse(body);

    console.log('🔍 Creating new user:', { name, email, role });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const hashedPassword = await hashPassword(randomPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role,
      },
    });

    console.log('✅ User created successfully:', user.id);

    // Send invitation email if requested
    if (sendInvite) {
      try {
        await sendInvitationEmail(email, name, randomPassword);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      temporaryPassword: sendInvite ? undefined : randomPassword, // Only return if not sent via email
      message: sendInvite 
        ? 'User created and invitation sent successfully'
        : 'User created successfully'
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error},
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendInvitationEmail(email: string, name: string, temporaryPassword: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Our Platform!</h2>
      
      <p>Hello ${name},</p>
      
      <p>An administrator has created an account for you on our platform. Here are your login details:</p>
      
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      
      <p style="color: #ef4444; font-weight: bold;">
        Important: Please change your password after your first login.
      </p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Login to Your Account
      </a>
      
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Best regards,<br>The Platform Team</p>
    </div>
  `;

  await sendEmail(
    email,
    'Welcome to Our Platform - Your Account is Ready',
    html
  );
}

// GET endpoint to fetch users (for the users list)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          subscription: {
            include: {
              tier: true,
            },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}