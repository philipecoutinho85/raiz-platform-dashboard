import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				raiz: {
					primary: '#1D8C5A',
					secondary: '#4FAF7A',
					accent: '#BADA9C',
					gold: '#BADA9C',
					light: '#F7FAF6',
					dark: '#2D405D'
				},
				home: {
					950: '#172233',
					900: '#2D405D',
					800: '#1D8C5A',
					700: '#4FAF7A',
					100: '#EEF6EF',
					cream: '#F7FAF6',
					warm: '#FBFCF8',
					gold: '#BADA9C',
					ink: '#1F2933',
					muted: '#667085',
					line: '#DDE8D8'
				}
			},
			fontFamily: {
				display: ['Manrope', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			boxShadow: {
				'home-glass': '0 18px 60px rgba(45, 64, 93, 0.08)',
				'home-card': '0 22px 70px rgba(45, 64, 93, 0.12)',
				'home-deep': '0 32px 90px rgba(45, 64, 93, 0.18)',
				'home-app': '0 24px 64px rgba(45, 64, 93, .16)',
				'home-glow': '0 0 42px rgba(186, 218, 156, 0.26)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'home-float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-16px)'
					}
				},
				'home-float-slow': {
					'0%, 100%': {
						transform: 'translateY(0) rotate(0deg)'
					},
					'50%': {
						transform: 'translateY(-12px) rotate(2deg)'
					}
				},
				'home-scan': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(320%)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.8s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'home-float': 'home-float 7s ease-in-out infinite',
				'home-floatSlow': 'home-float-slow 11s ease-in-out infinite',
				'home-scan': 'home-scan 2.8s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-raiz': 'linear-gradient(135deg, #2D405D 0%, #1D8C5A 100%)',
				'gradient-gold': 'linear-gradient(135deg, #BADA9C 0%, #4FAF7A 100%)',
				'gradient-hero': 'linear-gradient(135deg, #172233 0%, #2D405D 55%, #1D8C5A 100%)'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;