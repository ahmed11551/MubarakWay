"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface CaptchaInputProps {
  onVerify: (token: string, answer: number) => void
  onError?: (error: string) => void
}

export function CaptchaInput({ onVerify, onError }: CaptchaInputProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [operation, setOperation] = useState<"+" | "*">("+")
  const [answer, setAnswer] = useState("")
  const [token, setToken] = useState("")

  const generateChallenge = () => {
    const n1 = Math.floor(Math.random() * 10) + 1
    const n2 = Math.floor(Math.random() * 10) + 1
    const op = Math.random() > 0.5 ? "+" : "*" as const
    
    setNum1(n1)
    setNum2(n2)
    setOperation(op)
    setAnswer("")
    // Generate token using btoa (browser-compatible)
    setToken(btoa(`${Date.now()}-${Math.random()}`))
  }

  useEffect(() => {
    generateChallenge()
  }, [])

  const handleVerify = () => {
    const userAnswer = parseInt(answer, 10)
    if (isNaN(userAnswer)) {
      onError?.("Введите число")
      return
    }

    const correctAnswer = operation === "+" ? num1 + num2 : num1 * num2
    onVerify(token, correctAnswer)
  }

  const question = operation === "+" ? `${num1} + ${num2}` : `${num1} × ${num2}`

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">
        Подтвердите, что вы не робот <span className="text-red-500">*</span>
      </Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-lg font-semibold px-3 py-2 bg-muted rounded-md">
            {question} = ?
          </span>
          <Input
            id="captcha"
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Ответ"
            className="w-24"
            required
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          title="Обновить задачу"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <input type="hidden" name="captcha_token" value={token} />
      <input type="hidden" name="captcha_answer" value={answer} />
    </div>
  )
}

