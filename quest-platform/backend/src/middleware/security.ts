/**
 * Security Middleware Module
 *
 * Provides rate limiting, CORS configuration, and security headers
 * for protecting the Quest Platform API.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter store using Map
 * In-memory store for rate limiting requests
 * Note: In production with multiple server instances, use Redis
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiting middleware
 * Blocks requests that exceed the configured limits per IP address
 *
 * @param options - Configuration options
 * @param options.windowMs - Time window in milliseconds
 * @param options.max - Maximum requests per window
 * @param options.message - Error message for blocked requests
 */
export const rateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100;
  const message = options.message || 'Too many requests, please try again later';

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries (every 100 requests)
    if (Math.random() < 0.01) {
      for (const key in rateLimitStore) {
        if (rateLimitStore[key].resetTime < now) {
          delete rateLimitStore[key];
        }
      }
    }

    const client = rateLimitStore[ip] || { count: 0, resetTime: now + windowMs };

    if (client.resetTime < now) {
      // Reset window
      client.count = 1;
      client.resetTime = now + windowMs;
    } else {
      client.count++;
    }

    rateLimitStore[ip] = client;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - client.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000).toString());

    if (client.count > max) {
      return res.status(429).json({
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((client.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

/**
 * Gentle rate limiter for general API requests
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

/**
 * Aggressive rate limiter for payment endpoints
 * Prevents payment abuse
 */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many payment requests, please try again later'
});

/**
 * Additional security headers middleware
 * Complements helmet.js with additional protections
 * Note: Many headers are redundant with helmet, but added for explicit control
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Permissions Policy (Feature Policy) - Not fully covered by helmet
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), usb=()'
  );

  // Custom server identification removal
  res.setHeader('Server', 'QuestPlatform');

  // Cache control for sensitive endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  next();
};

/**
 * Input sanitization middleware
 * Sanitizes request body, query, and params
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Trim whitespace
    str = str.trim();

    // Escape HTML entities
    str = str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#x27;');

    return str;
  };

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) :
          typeof item === 'object' ? sanitizeObject(item) : item
        );
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Request size limiter middleware
 * Prevents DoS attacks through large payloads
 */
export const bodySizeLimit = (maxSize: string = '1mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const limit = parseInt(maxSize) * 1024 * 1024; // Convert to bytes

    if (contentLength > limit) {
      return res.status(413).json({
        message: 'Request entity too large',
        error: 'REQUEST_TOO_LARGE'
      });
    }
    next();
  };
};

/**
 * Remove server information header
 */
export const removeServerInfo = (req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Powered-By');
  next();
};