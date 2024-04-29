/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { formatDate, formatStatus } from "../app/format.js"
import mockStore from "../__mocks__/store"

import router from "../app/Router.js"
import Bills from "../containers/Bills.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on 'New Bill' button should navigate to the New Bill page", async () => {
      document.body.innerHTML = BillsUI({ data: [] })
      const onNavigate = jest.fn()
      new Bills({ document, onNavigate, localStorage: localStorageMock })
      const buttonNewBill = document.querySelector(
        `button[data-testid="btn-new-bill"]`
      )
      buttonNewBill.click()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    })

    test("Then clicking on the eye icon should open the bill proof modal", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`)
      iconEye.click()
      const modalFaded = document.querySelector(".modal.fade")
      setTimeout(() => {
        expect(modalFaded.classList.contains("show")).toBe(true)
      }, 1000)
    })

    test("Then getBills should return bills from the store", async () => {
      const mockedStore = {
        bills() {
          return {
            list() {
              return Promise.resolve(bills)
            },
          }
        },
      }
      const billsList = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockedStore,
        localStorage: localStorageMock,
      })
      const retrievedBills = await billsList.getBills()
      const formattedBills = bills.map((bill) => ({
        ...bill,
        date: formatDate(bill.date),
        status: formatStatus(bill.status),
      }))
      expect(retrievedBills).toEqual(formattedBills)
    })

    test("Then getBills should throw an error when failing to fetch bills", async () => {
      const error = new Error("Failed to fetch bills")

      const mockedStore = {
        bills() {
          return {
            list: jest.fn().mockRejectedValue(error),
          }
        },
      }

      const billsList = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockedStore,
        localStorage: localStorageMock,
      })

      await expect(billsList.getBills()).rejects.toThrow(expect.any(Error))
    })

    test("Then getBills should log the error when failing to fetch bills", async () => {
      const mockedStore = {
        bills() {
          return {
            list() {
              return Promise.resolve([
                {
                  date: "ceci n'est pas une date!!!",
                },
              ])
            },
          }
        },
      }
      const billsList = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockedStore,
        localStorage: localStorageMock,
      })

      const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {})

      await billsList.getBills()

      expect(consoleLog).toHaveBeenCalled()

      consoleLog.mockRestore()
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("Then fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      )

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => {
        const tableRows = document.querySelectorAll(
          'tbody[data-testid="tbody"] tr'
        )
        expect(tableRows).toBeTruthy()
      })
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        )
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            },
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
