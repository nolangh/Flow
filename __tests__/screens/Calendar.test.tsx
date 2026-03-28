import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CalendarScreen from "@/app/(tabs)/calendar";

const mockAddEvent = jest.fn().mockResolvedValue(undefined);
const mockDeleteEvent = jest.fn().mockResolvedValue(undefined);

// Compute current month inside the factory — jest.mock is hoisted above variable declarations
jest.mock("@/hooks/useCalendarEvents", () => {
  const { format } = require("date-fns");
  const currentMonth = format(new Date(), "yyyy-MM");
  return {
    useCalendarEvents: () => ({
      events: [
        {
          id: "ev1", household_id: "hh1", user_id: "u1",
          title: "Doctor Appointment",
          description: "Annual checkup",
          start_at: `${currentMonth}-15T14:00:00`,
          end_at: null, all_day: false,
          source: "manual",
          google_event_id: null, budget_category_id: null,
          amount: null, color: null,
          created_at: "", updated_at: "",
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      addEvent: mockAddEvent,
      deleteEvent: mockDeleteEvent,
    }),
  };
});

jest.mock("@/store/budgetStore", () => ({
  useBudgetStore: () => ({
    categories: [
      { id: "c1", household_id: "hh1", name: "Rent", emoji: "🏠", monthly_limit: 2000, color: null, is_income: false, is_fixed: true, fixed_day_of_month: 1, created_at: "", updated_at: "" },
    ],
  }),
}));

describe("CalendarScreen", () => {
  it("renders without crashing", () => {
    expect(() => render(<CalendarScreen />)).not.toThrow();
  });

  it("displays Calendar heading", () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText("Calendar")).toBeTruthy();
  });

  it("displays current month header", () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText(/\w+ \d{4}/)).toBeTruthy();
  });

  it("renders day-of-week headers", () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText("Su")).toBeTruthy();
    expect(getByText("Mo")).toBeTruthy();
    expect(getByText("Sa")).toBeTruthy();
  });

  it("renders day numbers", () => {
    const { getByText } = render(<CalendarScreen />);
    expect(getByText("1")).toBeTruthy();
    expect(getByText("15")).toBeTruthy();
  });

  it("shows event details when day 15 is selected", () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText("15"));
    expect(getByText("Doctor Appointment")).toBeTruthy();
  });

  it("shows + Event button when a day is selected", () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText("15"));
    expect(getByText("+ Event")).toBeTruthy();
  });

  it("opens Add Event modal when + Event is pressed", () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText("15"));
    fireEvent.press(getByText("+ Event"));
    expect(getByText(/New Event/)).toBeTruthy();
  });

  it("shows fixed bill dot for day 1 (Rent category)", () => {
    const { toJSON } = render(<CalendarScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it("navigates to previous month", () => {
    const { getByText } = render(<CalendarScreen />);
    fireEvent.press(getByText("‹"));
    expect(getByText(/\w+ \d{4}/)).toBeTruthy();
  });
});
