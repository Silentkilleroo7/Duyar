import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          injectRegister: null,
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'offline.html'],
          injectManifest: {
            maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
            rollupFormat: 'iife',
          },
          manifest: ({
            id: '/',
            name: 'Duyar Real Estate & Super App',
            short_name: 'Duyar',
            description: 'Premier real estate, property rental, and on-demand home services platform in Bangladesh.',
            theme_color: '#0a1211',
            background_color: '#0a1211',
            display: 'standalone',
            display_override: [
              'window-controls-overlay',
              'tabbed',
              'standalone',
              'minimal-ui'
            ],
            orientation: 'portrait-primary',
            start_url: '/',
            scope: '/',
            categories: ['lifestyle', 'business', 'utilities', 'productivity'],
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
            shortcuts: [
              {
                name: 'Browse Properties',
                short_name: 'Explore',
                description: 'Find apartments, flats, and rentals near you',
                url: '/?action=explore',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Post Property Ad',
                short_name: 'Post Ad',
                description: 'Publish a flat rental or sale advertisement',
                url: '/?action=post_ad',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Saved Properties',
                short_name: 'Favorites',
                description: 'View bookmarked and favorited homes',
                url: '/?action=saved_properties',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Digital Wallet',
                short_name: 'Wallet',
                description: 'Manage wallet balance, deposits, and rent payouts',
                url: '/?action=wallet',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              },
              {
                name: 'Inspection Notes',
                short_name: 'Notes',
                description: 'Quickly write inspection notes for visited properties',
                url: '/?action=new_note',
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
              }
            ],
            file_handlers: [
              {
                action: '/?handle_file=true',
                name: 'Duyar Property Document',
                accept: {
                  'application/pdf': ['.pdf'],
                  'image/png': ['.png'],
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/webp': ['.webp'],
                  'application/json': ['.json']
                },
                icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
                launch_type: 'single-client'
              }
            ],
            launch_handler: {
              client_mode: ['focus-existing', 'auto']
            },
            protocol_handlers: [
              {
                protocol: 'web+duyar',
                url: '/?property_ref=%s'
              }
            ],
            share_target: {
              action: '/',
              method: 'GET',
              enctype: 'application/x-www-form-urlencoded',
              params: {
                title: 'title',
                text: 'text',
                url: 'url'
              }
            },
            widgets: [
              {
                name: 'Duyar Featured Properties',
                short_name: 'Properties',
                description: 'Live view of verified rental apartments in Dhaka',
                tag: 'duyar-featured-properties',
                template: 'duyar-widget-template',
                ms_ac_template: '/widgets/property-widget.json',
                data: '/widgets/property-data.json',
                type: 'application/json',
                screenshots: [
                  {
                    src: '/pwa-512x512.png',
                    sizes: '512x512',
                    label: 'Duyar Real Estate Widget Preview'
                  }
                ],
                icons: [
                  {
                    src: '/pwa-192x192.png',
                    sizes: '192x192'
                  }
                ],
                auth: false,
                update: 3600
              }
            ],
            edge_side_panel: {
              preferred_width: 420
            },
            tab_strip: {
              home_tab: {
                scope: '/'
              },
              new_tab_button: {
                url: '/'
              }
            },
            note_taking: {
              new_note_url: '/?action=new_note'
            }
          }) as any,
          workbox: {
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'html-pages-cache',
                  networkTimeoutSeconds: 3,
                },
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkOnly',
              },
            ],
          },
          devOptions: {
            enabled: false,
          },
        }),
      ],
      build: {
        chunkSizeWarningLimit: 3000,
      },
      define: {
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
