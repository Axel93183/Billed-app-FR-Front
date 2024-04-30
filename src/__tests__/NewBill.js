/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let bill

    document.body.innerHTML = `
      <div>
        <form data-testid="form-new-bill"></form>
        <input data-testid="file">
      </div>
    `
    const onNavigate = jest.fn()

    const store = {
      bills: jest.fn(() => ({
        create: jest.fn().mockResolvedValue({
          fileUrl: "testUrl",
          key: "testKey",
        }),
        update: jest.fn().mockResolvedValue({}),
      })),
    }

    const localStorage = window.localStorage
    localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }))

    beforeEach(() => {
      bill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      })
    })

    test("Then I should create an instance of NewBill", () => {
      expect(bill).toBeInstanceOf(NewBill)
    })

    test("Then I should initialize the NewBill instance with correct properties", () => {
      expect(bill.document).toEqual(document)
      expect(bill.onNavigate).toEqual(onNavigate)
      expect(bill.store).toEqual(store)
      expect(bill.fileUrl).toBeNull()
      expect(bill.fileName).toBeNull()
      expect(bill.billId).toBeNull()
    })

    test("Then I should handle file change correctly when file extension is jpg", async () => {
      const allowedFile = new File(["file"], "test.jpg", { type: "image/jpg" })

      const inputElement = document.querySelector(`input[data-testid="file"]`)
      Object.defineProperty(inputElement, "files", {
        value: [allowedFile],
      })

      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\testpath\\test.jpg",
          files: [allowedFile],
        },
      }

      await bill.handleChangeFile(event)

      expect(bill.fileUrl).toBeDefined()
      expect(bill.fileName).toBe("test.jpg")
    })

    test("Then an error message should appear if the file extension is not allowed", async () => {
      const mockFile = new File(["file"], "file.txt", { type: "text/plain" })

      const inputElement = document.querySelector(`input[data-testid="file"]`)
      if (!inputElement.files) {
        Object.defineProperty(inputElement, "files", {
          value: [mockFile],
        })
      }

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\filepath\\file.txt",
          files: [mockFile],
        },
      }

      await bill.handleChangeFile(mockEvent)

      const errorMessage = document.querySelector(".error-file-extension")
      expect(errorMessage).toBeDefined()

      expect(inputElement.value).toEqual("")
    })

    test("Then I should navigate to ROUTES_PATH['Bills'] after form submission", async () => {
      document.body.innerHTML = `
      <div>
        <form data-testid="form-new-bill">
          <select data-testid="expense-type"></select>
          <input data-testid="expense-name">
          <input data-testid="amount">
          <input data-testid="datepicker">
          <input data-testid="vat">
          <input data-testid="pct">
          <textarea data-testid="commentary"></textarea>
        </form>
        <input data-testid="file">
      </div>
    `
      const formElement = document.querySelector(
        `form[data-testid="form-new-bill"]`
      )
      const mockEvent = {
        preventDefault: jest.fn(),
        target: formElement,
      }

      await bill.handleSubmit(mockEvent)

      expect(bill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
    })
  })
})
