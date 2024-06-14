const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("testing sqltoPartialUpdate fn", () => {
  test("returns key of obj data you want to update", () => {
    //sample data
    const dataToUpdate = {
      firstName: "Aliya",
      age: 32,
    };
    const jsToSql = {
      firstName: "first_name",
      age: "age",
    };

    //expected output
    const expectedsetCols = '"first_name"=$1, "age"=$2';
    const expectedValues = ["Aliya", 32];

    //test the function with insert values
    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

    //Assert
    expect(setCols).toBe(expectedsetCols);
    expect(values).toEqual(expect.arrayContaining(expectedValues));
  });
});
