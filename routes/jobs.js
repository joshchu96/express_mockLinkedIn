"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Jobs = require("../models/jobs");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const jobs = await Jobs.findAll();
    return res.json(jobs);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const job = await Jobs.get(id);
    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }
    const job = await Jobs.create(req.body);
    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:title", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }
    const job = await Jobs.update(req.params.title, req.body);
    return res.json(job);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    if (!res.locals.user.is_admin) {
      throw new BadRequestError("Unauthorized. Admin rights required.");
    }
    await Jobs.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (error) {
    return next(error);
  }
});
