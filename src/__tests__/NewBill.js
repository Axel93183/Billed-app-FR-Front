/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import { handleChangeFile } from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I should see the NewBill page", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
    test("Then the file input should accept only jpg, jpeg, and png files", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const input = screen.getByTestId("file");
      input.addEventListener('change', handleChangeFile);
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: { files: [file] } });
      input.dispatchEvent(event);
      const errorMessage = document.querySelector('.error-file-extension');
      expect(errorMessage).toBeNull();
    });
    test("Then an error message should appear if the file extension is not allowed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const input = screen.getByTestId("file");
      input.addEventListener('change', handleChangeFile);
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: { files: [file] } });
      input.dispatchEvent(event);
      const parentContainer = input.parentNode;
      const errorMessage = parentContainer.querySelector('.error-file-extension');
      expect(errorMessage).toBeDefined();
    });
    
  })
})
