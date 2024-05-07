/**
 * @jest-environment jsdom
 */

import { ROUTES_PATH } from "../constants/routes.js"
import NewBill from "../containers/NewBill.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let bill

    document.body.innerHTML = `
      <div>
        <form data-testid="form-new-bill">
          <select required data-testid="expense-type"></select>
          <input data-testid="expense-name">
          <input data-testid="amount">
          <input required data-testid="datepicker">
          <input data-testid="vat">
          <input required data-testid="pct">
          <textarea data-testid="commentary"></textarea>
          <input required data-testid="file">
          <button type="submit" id='btn-send-bill' class="btn btn-primary"></button>
        </form>
      </div>
    `
    const onNavigate = jest.fn()

    const createMock = jest.fn().mockResolvedValue({
      fileUrl: "testUrl",
      key: "testKey",
      status: 201,
    })

    const store = {
      bills: jest.fn(() => ({
        create: createMock,
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

    test("Then it should clear error message when file extension becomes valid", async () => {
      const invalidFile = new File(["file"], "invalid.txt", {
        type: "text/plain",
      })
      const inputElement = document.querySelector(`input[data-testid="file"]`)
      if (!inputElement.files) {
        Object.defineProperty(inputElement, "files", { value: [invalidFile] })
      }

      const eventInvalid = {
        preventDefault: jest.fn(),
        target: { value: "C:\\filepath\\invalid.txt", files: [invalidFile] },
      }
      await bill.handleChangeFile(eventInvalid)

      const validFile = new File(["file"], "valid.jpg", { type: "image/jpeg" })
      if (!inputElement.files) {
        Object.defineProperty(inputElement, "files", { value: [validFile] })
      }

      const eventValid = {
        preventDefault: jest.fn(),
        target: { value: "C:\\filepath\\valid.jpg", files: [validFile] },
      }
      await bill.handleChangeFile(eventValid)

      const errorMessage = document.querySelector(".error-file-extension")
      expect(errorMessage).toBeNull()
    })

    test("Then I should navigate to ROUTES_PATH['Bills'] after form submission", async () => {
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

    test("Then form submission should fail when required fields are empty", async () => {
      const formElement = document.querySelector(
        `form[data-testid="form-new-bill"]`
      )

      const fileInput = formElement.querySelector(`input[data-testid="file"]`)
      fileInput.value = ""

      const mockEvent = {
        preventDefault: jest.fn(),
        target: formElement,
      }

      await bill.handleSubmit(mockEvent)

      expect(bill.onNavigate).not.toHaveBeenCalledWith()
    })

    /****************** test d'intégration POST **********************/

    test("Then it should post the new bill and return a success status", async () => {
      const mockFormData = new FormData()
      mockFormData.append("file", new File(["content"], "filename.jpg"))
      mockFormData.append("email", "test@test.com")

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockImplementation((selector) => {
            switch (selector) {
              case `input[data-testid="expense-name"]`:
                return { value: "Vol Paris Londres" }
              case `select[data-testid="expense-type"]`:
                return { value: "Transports" }
              case `input[data-testid="amount"]`:
                return { value: "348" }
              case `input[data-testid="datepicker"]`:
                return { value: "2024-05-04" }
              case `input[data-testid="vat"]`:
                return { value: "70" }
              case `input[data-testid="pct"]`:
                return { value: "20" }
              case `textarea[data-testid="commentary"]`:
                return { value: "Commentaire de test" }
              case `input[data-testid="file"]`:
                return { files: [new File(["content"], "filename.jpg")] }
              default:
                return null
            }
          }),
        },
      }

      await bill.handleSubmit(mockEvent)

      expect(createMock).toHaveBeenCalledWith({
        data: mockFormData,
        headers: { noContentType: true },
      })

      const response = await createMock.mock.results[0].value
      expect(response.status).toBe(201)
    })
  })
})
