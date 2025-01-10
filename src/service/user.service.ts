import { FilterQuery, UpdateQuery } from "mongoose";
import userModel, { UserInput, UserDocument } from "../model/user.model";
import { compass, createToken, dBSelector } from "../utils/helper";
import { permitDocument } from "../model/permit.model";
import collectionModel from "../model/collection.model";
import { getStationDetail } from "./stationDetail.service";
import { csStationDetailModel, ksStationDetailModel } from "../model/stationDetail.model";

export const registerUser = async (payload: UserInput) => {
  try {
    let result = await userModel.create(payload);
    let userObj: Partial<UserDocument> = result.toObject();
    delete userObj.password;
    return userObj;
  } catch (e: any) {
    throw new Error(e);
  }
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    let user = await userModel
      .findOne({ email })
      .populate("roles permits collectionId")
      .exec();
    // .select("-__v");

    console.log(user);

    if (!user || !compass(password, user.password)) {
      throw new Error("Creditial Error");
    }

    let userObj: Partial<UserDocument> | any = user.toObject();
    userObj["token"] = createToken(userObj);

    delete userObj.password;

    return userObj;
  } catch (e: any) {
    throw new Error(e);
  }
};

export const getUser = async (query: FilterQuery<UserDocument>) => {
  try {
    return await userModel
      .find(query)
      .lean()
      .populate({ path: "roles permits collectionId" })
      .select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const getStationUser = async (query: FilterQuery<UserDocument>) => {
  try {
    const user = await userModel.findOne({ stationId: query.id });

    if(!user){
      throw new Error("No User Found")
    }

    const collection = await collectionModel.findOne(user.collectionId)

    if(!collection){
      throw new Error("No Collection Found")
    }

    let selectedModel = dBSelector(
      collection.collectionName,
      ksStationDetailModel,
      csStationDetailModel
    );

    const stationDetail = await selectedModel.findOne({ _id: user.stationId }).select("-__v");

    return stationDetail;

  } catch (e: any) {
    throw new Error(e);
  }
}

export const getCredentialUser = async (query: FilterQuery<UserDocument>) => {
  try {
    let result = await userModel
      .find(query)
      .lean()
      .populate({ path: "roles permits" })
      .select("-__v");
    return [result[0].email, result[0].password];
  } catch (e: any) {
    throw new Error(e);
  }
};

export const updateUser = async (
  query: FilterQuery<UserDocument>,
  body: UpdateQuery<UserDocument>
) => {
  try {
    await userModel.updateMany(query, body);
    return await userModel.find(query).lean();
  } catch (e: any) {
    throw new Error(e);
  }
};

export const deleteUser = async (query: FilterQuery<UserDocument>) => {
  try {
    return await userModel.deleteMany(query);
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userAddRole = async (
  userId: UserDocument["_id"],
  roleId: UserDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, {
      $push: { roles: roleId },
    });
    return await userModel.findById(userId).select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userRemoveRole = async (
  userId: UserDocument["_id"],
  roleId: UserDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, {
      $pull: { roles: roleId },
    });
    return await userModel.findById(userId).select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userAddPermit = async (
  userId: UserDocument["_id"],
  permitId: permitDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, { $push: { permits: permitId } });
    return await userModel.findById(userId);
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userRemovePermit = async (
  userId: UserDocument["_id"],
  permitId: permitDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, { $pull: { permits: permitId } });
    return await userModel.findById(userId);
  } catch (e: any) {
    throw new Error(e);
  }
};


