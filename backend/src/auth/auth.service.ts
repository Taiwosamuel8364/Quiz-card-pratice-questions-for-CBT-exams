import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Generate token
    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  }
}