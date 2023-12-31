import * as Yup from "yup";
import { Request, Response } from "express";
// import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";
import Company from "../models/Company";

import { unlink, PathLike } from "fs";

import ListCompaniesService from "../services/CompanyService/ListCompaniesService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import UpdateCompanyService, {
  UpdateImageService
} from "../services/CompanyService/UpdateCompanyService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import UpdateSchedulesService from "../services/CompanyService/UpdateSchedulesService";
import DeleteCompanyService from "../services/CompanyService/DeleteCompanyService";
import FindAllCompaniesService from "../services/CompanyService/FindAllCompaniesService";
import User from "../models/User";
import { CreateInvoiceService } from "../services/InvoicesService/UpdateInvoiceService";
import Invoices from "../models/Invoices";
import Plan from "../models/Plan";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type CompanyData = {
  name: string;
  id?: number;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  campaignsEnabled?: boolean;
  dueDate?: string;
  recurrence?: string;
};

type SchedulesData = {
  schedules: [];
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }

  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { companies, count, hasMore } = await ListCompaniesService({
    searchParam,
    pageNumber
  });

  return res.json({ companies, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const userId = req?.user?.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser?.super === false || req.url !== "/companies/cadastro") {
    throw new AppError("você nao tem permissão para este consulta");
  }

  const newCompany: CompanyData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(newCompany);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const company = await CreateCompanyService(newCompany);

  const { dueDate } = newCompany;
  const { id, planId } = company;
  await CreateInvoiceService({ companyId: id, planId, dueDate, stat: "open" });
  return res.status(200).json(company);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  const company = await ShowCompanyService(id);

  return res.status(200).json(company);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }
  const companies: Company[] = await FindAllCompaniesService();

  return res.status(200).json(companies);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);
  const companyData: CompanyData = req.body;

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(companyData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const company = await UpdateCompanyService({ id, ...companyData });

  const planoAtual = await Plan.findByPk(company.planId);
  const invoices = await Invoices.findAll({
    where: { companyId: companyData.id }
  });

  const invoice = invoices.find(voi => voi.status === "open");
  await invoice.update({
    detail: planoAtual.name,
    value: planoAtual.value,
    updatedAt: new Date().toString()
  });

  return res.status(200).json(company);
};

export const updateSchedules = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }
  const { schedules }: SchedulesData = req.body;
  const { id } = req.params;

  const company = await UpdateSchedulesService({
    id,
    schedules
  });

  return res.status(200).json(company);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.user.id;
  const requestUser = await User.findByPk(userId);

  if (requestUser.super === false) {
    throw new AppError("você nao tem permissão para este consulta");
  }
  const { id } = req.params;

  const company = await DeleteCompanyService(id);

  return res.status(200).json(company);
};

export const updateImage = async (
  req: Request,
  _res: Response
): Promise<void> => {
  const { file } = req;

  try {
    const { id } = req.params;

    const company = await ShowCompanyService(id);
    await UpdateImageService(id, file.filename);

    if (company.logo !== null) {
      const caminho = `public/images/${company.logo}`;
      unlink(caminho, err => {
        if (err) {
          console.error(`Erro ao excluir a imagem ${caminho}: ${err}`);
        }
      });
    }
  } catch (error) {
    const caminho = file?.path as PathLike;
    unlink(caminho, err => {
      if (err) {
        console.error(`Erro ao excluir a imagem ${caminho}: ${err}`);
      }
    });
  }
};
