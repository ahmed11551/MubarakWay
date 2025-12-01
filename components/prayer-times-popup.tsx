"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface PrayerTime {
  name: string
  time: string
  startTime: string
  endTime: string
  isNext: boolean
}

interface PrayerTimesData {
  Fajr: string
  Sunrise: string
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

export function PrayerTimesPopup() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [currentTime, setCurrentTime] = useState<string>("")
  const [nextPrayer, setNextPrayer] = useState<string>("")
  const [nextPrayerTime, setNextPrayerTime] = useState<string>("")
  const [timeUntilNext, setTimeUntilNext] = useState<string>("")
  const [location, setLocation] = useState<string>("Москва")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  // Check if popup was already shown today
  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem("prayer-times-popup-shown")
    
    // Show popup only once per day
    if (lastShown !== today) {
      setShowPopup(true)
    }
  }, [])

  // Get user location or use default (Moscow)
  useEffect(() => {
    if (!showPopup) return

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

        // Helper function to calculate time difference in minutes
        const timeToMinutes = (timeStr: string): number => {
          const [hours, minutes] = timeStr.split(":").map(Number)
          return hours * 60 + minutes
        }

        // Helper function to add minutes to time string
        const addMinutes = (timeStr: string, minutes: number): string => {
          const totalMinutes = timeToMinutes(timeStr) + minutes
          const hours = Math.floor(totalMinutes / 60) % 24
          const mins = totalMinutes % 60
          return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
        }

        // Parse all times
        const fajrTime = parseTime(timings.Fajr)
        const sunriseTime = parseTime(timings.Sunrise)
        const dhuhrTime = parseTime(timings.Dhuhr)
        const asrTime = parseTime(timings.Asr)
        const maghribTime = parseTime(timings.Maghrib)
        const ishaTime = parseTime(timings.Isha)

        // Calculate prayer time boundaries
        // Fajr: starts at Fajr, ends at Sunrise
        // Dhuhr: starts at Dhuhr, ends at Asr
        // Asr: starts at Asr, ends at Maghrib
        // Maghrib: starts at Maghrib, ends at Isha
        // Isha: starts at Isha, ends at next Fajr (or 24:00 if calculating for today)
        const times: PrayerTime[] = [
          {
            name: PRAYER_NAMES.Fajr,
            time: fajrTime,
            startTime: fajrTime,
            endTime: sunriseTime,
            isNext: false,
          },
          {
            name: PRAYER_NAMES.Dhuhr,
            time: dhuhrTime,
            startTime: dhuhrTime,
            endTime: asrTime,
            isNext: false,
          },
          {
            name: PRAYER_NAMES.Asr,
            time: asrTime,
            startTime: asrTime,
            endTime: maghribTime,
            isNext: false,
          },
          {
            name: PRAYER_NAMES.Maghrib,
            time: maghribTime,
            startTime: maghribTime,
            endTime: ishaTime,
            isNext: false,
          },
          {
            name: PRAYER_NAMES.Isha,
            time: ishaTime,
            startTime: ishaTime,
            // Isha ends at next Fajr (24 hours later, or we can show "до Фаджр")
            endTime: addMinutes(fajrTime, 24 * 60),
            isNext: false,
          },
        ]

        // Find next prayer
        const now = new Date()
        const currentHours = now.getHours()
        const currentMinutes = now.getMinutes()
        const currentTimeInMinutes = currentHours * 60 + currentMinutes
        let nextPrayerIndex = -1
        let nextPrayerName = ""
        let nextPrayerTimeStr = ""

        for (let i = 0; i < times.length; i++) {
          const prayerTimeInMinutes = timeToMinutes(times[i].time)

          // If current time is before this prayer time, this is the next prayer
          if (currentTimeInMinutes < prayerTimeInMinutes) {
            nextPrayerIndex = i
            nextPrayerName = times[i].name
            nextPrayerTimeStr = times[i].time
            break
          }
        }

        // If no prayer found for today (it's after Isha), next is Fajr (tomorrow)
        if (nextPrayerIndex === -1) {
          nextPrayerIndex = 0
          nextPrayerName = times[0].name
          nextPrayerTimeStr = times[0].time
        }

        times[nextPrayerIndex].isNext = true
        setNextPrayer(nextPrayerName)
        setNextPrayerTime(nextPrayerTimeStr)

        setPrayerTimes(times)
      } catch (err) {
        console.error("Error fetching prayer times:", err)
        setError("Не удалось загрузить время намаза")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrayerTimes()
  }, [showPopup])

  // Separate effect for updating time and countdown
  useEffect(() => {
    if (!showPopup) return

    // Update current time and time until next prayer
    const updateCurrentTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }))
      
      // Calculate time until next prayer
      if (nextPrayerTime) {
        const [nextHours, nextMinutes] = nextPrayerTime.split(":").map(Number)
        const nextPrayerDate = new Date()
        nextPrayerDate.setHours(nextHours, nextMinutes, 0, 0)
        
        // If next prayer time has passed today, it's tomorrow
        if (nextPrayerDate < now) {
          nextPrayerDate.setDate(nextPrayerDate.getDate() + 1)
        }
        
        const diffMs = nextPrayerDate.getTime() - now.getTime()
        const diffMinutes = Math.floor(diffMs / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        
        if (hours > 0) {
          setTimeUntilNext(`${hours} ч ${minutes} мин`)
        } else {
          setTimeUntilNext(`${minutes} мин`)
        }
      }
    }

    updateCurrentTime()
    const timeInterval = setInterval(updateCurrentTime, 1000) // Update every second

    return () => {
      clearInterval(timeInterval)
    }
  }, [showPopup, nextPrayerTime])

  const handleClose = () => {
    setShowPopup(false)
    // Mark as shown for today
    const today = new Date().toDateString()
    localStorage.setItem("prayer-times-popup-shown", today)
  }

  if (!showPopup) return null

  return (
    <Dialog open={showPopup} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <DialogTitle>Время намаза</DialogTitle>
          </div>
          <DialogDescription className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
            {nextPrayer && nextPrayerTime && (
              <div className="flex flex-col gap-1 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Следующий:</span>
                  <span className="font-semibold text-primary">{nextPrayer}</span>
                  <span className="font-mono font-semibold text-primary">{nextPrayerTime}</span>
                </div>
                {timeUntilNext && (
                  <div className="text-xs text-muted-foreground">
                    До намаза: <span className="font-semibold text-foreground">{timeUntilNext}</span>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
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
              {prayerTimes.map((prayer) => (
                <div
                  key={prayer.name}
                  className={`flex flex-col py-2 px-3 rounded-lg transition-colors ${
                    prayer.isNext
                      ? "bg-primary/10 border-2 border-primary/30 font-semibold"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {prayer.startTime} - {prayer.name === PRAYER_NAMES.Isha ? "до Фаджр" : prayer.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

