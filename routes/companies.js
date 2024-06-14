"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("./company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }

    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    let { minEmployees, maxEmployees, name } = req.query;
    minEmployees = minEmployees ? parseInt(minEmployees) : undefined;
    maxEmployees = maxEmployees ? parseInt(maxEmployees) : undefined;

    if (minEmployees && maxEmployees && minEmployees > maxEmployees) {
      throw new BadRequestError("min cannot be greater than max employees");
    }

    let sql = "SELECT * FROM companies WHERE 1 = 1"; // Start with a true condition

    // Build conditions based on query parameters
    const params = [];
    if (name) {
      sql += " AND LOWER(name) LIKE LOWER($1)"; // Case-insensitive search for name
      params.push(`%${name}%`);
    }
    if (minEmployees) {
      sql += " AND num_employees >= $2"; // Greater than or equal to minEmployees
      params.push(minEmployees);
    }
    if (maxEmployees) {
      sql += " AND num_employees <= $3"; // Less than or equal to maxEmployees
      params.push(maxEmployees);
    }
    const results = await db.query(sql, params);
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }

    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }

    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

router.get("/:handle", async (req, res) => {
  const handle = req.params.handle.toLowerCase();
  try {
    const company = await Company.getCompanyByHandle(handle);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({
      company: {
        handle: company.company_handle,
        name: company.company_name,
        num_employees: company.num_employees,
        description: company.description,
        logo_url: company.logo_url,
        jobs: company.jobs,
      },
    });
  } catch (err) {
    console.error("Error querying database", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
