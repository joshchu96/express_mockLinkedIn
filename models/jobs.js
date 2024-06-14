"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Jobs {
  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
      `SELECT title FROM jobs Where title = $1`,
      [title]
    );
    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate Job: ${title}`);

    const result = await db.query(
      `INSERT INTO jobs
        (title, salary,equity, company_handle)
        VALUES ($1,$2,$3,$4)
        RETURNING title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];
    return job;
  }

  //find all jobs
  static async findAll() {
    const jobsResults = await db.query(
      `SELECT title, salary, equity, company_handle
        FROM jobs`
    );
    const jobs = jobsResults.rows;
    return jobs;
  }

  static async get(id) {
    const jobsResults = await db.query(
      `SELECT title, salary, equity,company_handle
        FROM jobs
        WHERE id = $1`,
      [id]
    );
    const job = jobsResults.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id} `);
    return job;
  }

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      salary: "salary",
      equity: "equity",
    });
    const titleVarIdx = "$" + (values.length + 1);
    const querySql = `UPDATE jobs
                            SET ${setCols} WHERE title = ${titleVarIdx}
                            RETURNING title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows;
    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  //delete job function
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs
        WHERE id = $1
        RETURNING title`,
      [title]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError("No Job: ${id}");
    return job;
  }
}
