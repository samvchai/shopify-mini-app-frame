'use client';

import Link from 'next/link';
import { VariantSelector } from './VariantSelector';

export function ProductDetail({ 
  product, 
  selectedVariant, 
  onVariantChange, 
  onBuyNow 
}) {
  const mainImage = product.images?.edges?.[0]?.node;
  const price = selectedVariant?.price || product.priceRange?.minVariantPrice?.amount || '0';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center">
          <Link href="/" className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {product.title}
          </h1>
        </div>
      </header>

      <main className="pb-20">
        {mainImage && (
          <div className="aspect-square bg-white">
            <img
              src={mainImage.url}
              alt={mainImage.altText || product.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{product.title}</h2>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${parseFloat(price).toFixed(2)}
            </p>
          </div>

          <VariantSelector
            variants={product.variants?.edges}
            selectedVariant={selectedVariant}
            onVariantChange={onVariantChange}
          />

          {product.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <button
          onClick={onBuyNow}
          disabled={!selectedVariant?.availableForSale}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {selectedVariant?.availableForSale 
            ? `Buy with ${parseFloat(price).toFixed(2)} USDC` 
            : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}