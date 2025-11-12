"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type Schedule = {
  date: string;
  title: string;
};

const TableCalendar: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState("");
  const [events, setEvents] = useState<Schedule[]>([]);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDay = firstDayOfMonth.getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.trim() || !selectedDate) return;
    const dateKey = selectedDate.toISOString().split("T")[0];
    setEvents((prev) => [...prev, { date: dateKey, title: newEvent }]);
    setNewEvent("");
    setShowModal(false);
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateKey);
  };

  const getMonthName = (month: number) =>
    new Date(currentYear, month).toLocaleString("default", { month: "long" });

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startingDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    calendarDays.push(new Date(currentYear, currentMonth, d));

  return (
    <section className="bg-[#1C1F2E] text-white rounded-2xl shadow-lg p-6 w-full max-w-full mx-auto ">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-[#2C2C3E] hover:bg-[#3C3C4E] rounded-full transition"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-semibold">
            {getMonthName(currentMonth)} {currentYear}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 bg-[#2C2C3E] hover:bg-[#3C3C4E] rounded-full transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Click a date to add or view events.
        </p>
      </div>

      {/* Table Calendar */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-[#2C2C3E]">
              {daysOfWeek.map((day) => (
                <th
                  key={day}
                  className="p-3 font-semibold border border-[#3C3C4E]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({
              length: Math.ceil(calendarDays.length / 7),
            }).map((_, weekIndex) => (
              <tr key={weekIndex}>
                {calendarDays
                  .slice(weekIndex * 7, weekIndex * 7 + 7)
                  .map((date, index) => {
                    const isToday =
                      date &&
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
                    const eventsForDay = date ? getEventsForDate(date) : [];

                    return (
                      <td
                        key={index}
                        onClick={() => date && (setSelectedDate(date), setShowModal(true))}
                        className={`border border-[#3C3C4E] align-top cursor-pointer transition p-2 h-32 relative ${
                          date
                            ? "hover:bg-[#2C2C3E]"
                            : "bg-[#1C1F2E] cursor-default"
                        } ${isToday ? "bg-[#3C3C4E]" : ""}`}
                      >
                        {date && (
                          <>
                            <div className="flex justify-between items-center mb-1">
                              <span
                                className={`text-sm font-semibold ${
                                  isToday ? "text-purple-500" : "text-gray-200"
                                }`}
                              >
                                {date.getDate()}
                              </span>
                              <Plus
                                size={14}
                                className="text-gray-400 hover:text-blue-400 transition"
                              />
                            </div>

                            {/* Events */}
                            <div className="text-left space-y-1">
                              {eventsForDay.slice(0, 3).map((ev, i) => (
                                <p
                                  key={i}
                                  className="bg-blue-500 text-xs rounded-md px-2 py-1 truncate"
                                >
                                  {ev.title}
                                </p>
                              ))}
                              {eventsForDay.length > 3 && (
                                <p className="text-xs text-gray-400">
                                  +{eventsForDay.length - 3} more
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding Schedule */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-10">
          <div className="bg-[#2C2C3E] p-6 rounded-2xl w-96 relative shadow-xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-2">
              Add Schedule - {selectedDate.toDateString()}
            </h3>

            <input
              type="text"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              placeholder="Enter event title..."
              className="w-full px-3 py-2 rounded-md bg-[#1E1E2F] text-white border border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none mb-4"
            />

            <button
              onClick={handleAddEvent}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
            >
              Save Event
            </button>

            {/* Show Events for This Day */}
            <div className="mt-4">
              <h4 className="text-sm text-gray-300 mb-1">Your Events:</h4>
              {getEventsForDate(selectedDate).length > 0 ? (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {getEventsForDate(selectedDate).map((ev, i) => (
                    <li
                      key={i}
                      className="bg-[#1E1E2F] px-3 py-1 rounded-md text-blue-300 text-sm"
                    >
                      • {ev.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No events yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TableCalendar;
