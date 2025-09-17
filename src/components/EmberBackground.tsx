'use client'

import { FC, useEffect, useRef } from 'react'

interface EmberBackgroundProps {
  isLoading?: boolean;
}

const EmberBackground: FC<EmberBackgroundProps> = ({ isLoading = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const embers: Ember[] = []
    const gridSize = 30
    const emberSpawnRate = 0.005 // Reduced spawn rate for a calmer base
    
    const mouse = {
      x: -100,
      y: -100,
      radius: 100
    }

    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = event.clientX
        mouse.y = event.clientY
    }

    class Ember {
      x: number
      y: number
      brightness: number
      maxBrightness: number
      isFading: boolean

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.brightness = 0
        this.maxBrightness = Math.random() * 0.5 + 0.3 // Random max brightness
        this.isFading = true
      }

      update() {
        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Agitate embers near the mouse
        if (distance < mouse.radius) {
          this.ignite(0.9) // Ignite with high intensity
        }

        if (this.isFading) {
          if (this.brightness > 0) {
            this.brightness -= 0.015
          } else {
            this.brightness = 0
          }
        } else {
          if (this.brightness < this.maxBrightness) {
            this.brightness += 0.02
          } else {
            this.isFading = true
          }
        }
      }

      draw() {
        if (this.brightness > 0) {
          ctx!.fillStyle = `rgba(255, 69, 0, ${this.brightness})`
          ctx!.fillRect(this.x, this.y, gridSize, gridSize)
        }
      }

      ignite(intensity = Math.random() * 0.5 + 0.3) {
        if (this.brightness <= 0) {
          this.isFading = false
          this.maxBrightness = intensity
        }
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      embers.length = 0 // Clear embers array
      init()
    }

    const init = () => {
      for (let y = 0; y < canvas.height; y += gridSize) {
        for (let x = 0; x < canvas.width; x += gridSize) {
          embers.push(new Ember(x, y))
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      embers.forEach(ember => {
        if (Math.random() < emberSpawnRate) {
          ember.ignite()
        }
        ember.update()
        ember.draw()
      })

      animationFrameId = requestAnimationFrame(animate)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full bg-background" 
        style={{ zIndex: 0 }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 10 }} />
      )}
    </div>
  )
}

export default EmberBackground
