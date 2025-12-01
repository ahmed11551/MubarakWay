"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PrayerTime {
  name: string
  time: string
  isNext: boolean
}

interface PrayerTimesData {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

const PRAYER_NAMES: Record<string, string> = {
  Fajr: "Фаджр",
  Dhuhr: "Зухр",
  Asr: "Аср",
  Maghrib: "Магриб",
  Isha: "Иша",
}

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

export function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [currentTime, setCurrentTime] = useState<string>("")
  const [nextPrayer, setNextPrayer] = useState<string>("")
  const [location, setLocation] = useState<string>("Москва")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user location or use default (Moscow)
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Default coordinates for Moscow (can be changed based on user location)
        let latitude = 55.7558
        let longitude = 37.6173
        let cityName = "Москва"

        // Try to get user's location
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            })
            latitude = position.coords.latitude
            longitude = position.coords.longitude
            cityName = "Ваше местоположение"
          } catch (geoError) {
            // Use default location if geolocation fails
            console.log("Using default location (Moscow)")
          }
        }

        setLocation(cityName)

        // Fetch prayer times from Aladhan API
        const today = new Date()
        const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
        
        // Use calculation method 2 (Muslim World League) - common for Russia
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2&school=1`
        )

        if (!response.ok) {
          throw new Error("Не удалось загрузить время намаза")
        }

        const data = await response.json()
        const timings = data.data.timings as PrayerTimesData

        // Helper function to parse time string (handles formats like "05:30" or "05:30 (GMT+3)")
        const parseTime = (timeStr: string): string => {
          // Extract time part (HH:MM) from string
          const match = timeStr.match(/(\d{1,2}):(\d{2})/)
          if (match) {
            const hours = match[1].padStart(2, "0")
            const minutes = match[2]
            return `${hours}:${minutes}`
          }
          return timeStr
        }

        // Convert times to PrayerTime format
        const times: PrayerTime[] = PRAYER_ORDER.map((key) => {
          const rawTime = timings[key as keyof PrayerTimesData]
          const formattedTime = parseTime(rawTime)
          return {
            name: PRAYER_NAMES[key],
            time: formattedTime,
            isNext: false,
          }
        })

        // Find next prayer
        const now = new Date()
        const currentHours = now.getHours()
        const currentMinutes = now.getMinutes()
        let nextPrayerIndex = -1
        let nextPrayerName = ""

        for (let i = 0; i < times.length; i++) {
          const [prayerHours, prayerMinutes] = times[i].time.split(":").map(Number)
          const prayerTimeInMinutes = prayerHours * 60 + prayerMinutes
          const currentTimeInMinutes = currentHours * 60 + currentMinutes

          // If current time is before this prayer time, this is the next prayer
          if (currentTimeInMinutes < prayerTimeInMinutes) {
            nextPrayerIndex = i
            nextPrayerName = times[i].name
            break
          }
        }

        // If no prayer found for today (it's after Isha), next is Fajr
        if (nextPrayerIndex === -1) {
          nextPrayerIndex = 0
          nextPrayerName = times[0].name
        }

        times[nextPrayerIndex].isNext = true
        setNextPrayer(nextPrayerName)

        setPrayerTimes(times)
      } catch (err) {
        console.error("Error fetching prayer times:", err)
        setError("Не удалось загрузить время намаза")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrayerTimes()

    // Update current time every minute
    const updateCurrentTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }))
    }

    updateCurrentTime()
    const timeInterval = setInterval(updateCurrentTime, 60000)

    // Refresh prayer times every hour
    const prayerInterval = setInterval(fetchPrayerTimes, 3600000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(prayerInterval)
    }
  }, [])

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Время намаза</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>
        {currentTime && (
          <CardDescription className="text-sm">
            Текущее время: <span className="font-semibold text-foreground">{currentTime}</span>
            {nextPrayer && (
              <>
                {" • "}
                Следующий: <span className="font-semibold text-primary">{nextPrayer}</span>
              </>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-muted-foreground">{error}</div>
        ) : (
          <div className="space-y-2">
            {prayerTimes.map((prayer, index) => (
              <div
                key={prayer.name}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  prayer.isNext
                    ? "bg-primary/10 border-2 border-primary/30 font-semibold"
                    : "hover:bg-muted/50"
                }`}
              >
                <span
                  className={`text-sm ${
                    prayer.isNext ? "text-primary" : "text-foreground"
                  }`}
                >
                  {prayer.name}
                </span>
                <span
                  className={`text-sm font-mono ${
                    prayer.isNext ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {prayer.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

