import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image src="/logo.svg" alt="ForgeX Logo" width={24} height={24} />
      <span className="font-bold inline-block">ForgeX</span>
    </Link>
  );
}
