import { Form, Image, Input, Modal, Select, Upload, type GetProp, type UploadFile, type UploadProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { updateDeviceCatalog, uploadImageDeviceCatalog } from "../../../../../config/Api";
import { useAppDispatch, useAppSelector } from "../../../../../redux/hooks";
import {
    fetchDeviceCatalogs,
    selectDeviceCatalogLastListQuery,
} from "../../../../../redux/features/v2/deviceCatalogSlice";
import { DEFAULT_ADMIN_LIST_QUERY } from "../../../../../utils/pagination/defaultListQuery";
import type { ICreateDeviceCatalogRequest, IDeviceCatalog } from "../../../../../types/v2/deviceCatalog";
import {
    DEVICE_TYPE_SELECT_OPTIONS,
    MOBILITY_TYPE_SELECT_OPTIONS,
    STATUS_SELECT_OPTIONS,
} from "../../../../../utils/constants/deviceCatalog.constants";

interface IProps {
    openModalUpdate: boolean;
    setOpenModalUpdate: (v: boolean) => void;
    catalogEdit: IDeviceCatalog | null;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const ModalUpdateDeviceCatalog = ({ openModalUpdate, setOpenModalUpdate, catalogEdit }: IProps) => {
    const [form] = Form.useForm<ICreateDeviceCatalogRequest>();
    const dispatch = useAppDispatch();
    const listQuery = useAppSelector(selectDeviceCatalogLastListQuery);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useEffect(() => {
        if (!catalogEdit || !openModalUpdate) {
            return;
        }

        form.setFieldsValue({
            deviceName: catalogEdit.deviceName,
            deviceType: catalogEdit.deviceType,
            mobilityType: catalogEdit.mobilityType,
            manufacturer: catalogEdit.manufacturer ?? undefined,
            model: catalogEdit.model ?? undefined,
            description: catalogEdit.description ?? undefined,
            imageUrl: catalogEdit.imageUrl ?? undefined,
            status: catalogEdit.status,
        });

        if (catalogEdit.imageUrl) {
            setFileList([
                {
                    uid: "-1",
                    name: "device",
                    status: "done",
                    url: catalogEdit.imageUrl,
                },
            ]);
        } else {
            setFileList([]);
        }
        setPreviewImage("");
        setPreviewOpen(false);
    }, [catalogEdit, openModalUpdate, form]);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps["onChange"] = ({ fileList: fl }) => {
        setFileList(fl);
        if (fl.length === 0) {
            form.setFieldValue("imageUrl", undefined);
        }
    };

    const uploadButton = (
        <button style={{ border: 0, background: "none" }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const handleUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            const res = await uploadImageDeviceCatalog(file as File);
            const imageUrl = res.data?.url;

            form.setFieldValue("imageUrl", imageUrl);

            setFileList([
                {
                    uid: (file as FileType).uid || String(Date.now()),
                    name: (file as FileType).name,
                    status: "done",
                    url: imageUrl,
                    originFileObj: file,
                },
            ]);

            onSuccess?.("ok");
            toast.success("Upload ảnh thành công");
        } catch (err) {
            onError?.(err);
            toast.error("Upload ảnh thất bại");
        }
    };

    const handleUpdate = async (values: ICreateDeviceCatalogRequest) => {
        if (!catalogEdit?.id) {
            toast.error("ID danh mục không hợp lệ");
            return;
        }

        try {
            const res = await updateDeviceCatalog(catalogEdit.id, values);
            if (res.data.statusCode === 200) {
                toast.success(res.data.message ?? "Cập nhật danh mục thiết bị thành công");
                await dispatch(fetchDeviceCatalogs(listQuery || DEFAULT_ADMIN_LIST_QUERY));
                form.resetFields();
                setFileList([]);
                setPreviewImage("");
                setOpenModalUpdate(false);
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <strong>Có lỗi xảy ra!</strong>
                    <div>{m}</div>
                </div>
            );
        }
    };

    return (
        <Modal
            title="Cập nhật danh mục thiết bị"
            maskClosable={false}
            open={openModalUpdate}
            okText="Lưu"
            cancelText="Hủy"
            onOk={() => form.submit()}
            onCancel={() => setOpenModalUpdate(false)}
        >
            <hr />
            <Form<ICreateDeviceCatalogRequest> form={form} layout="vertical" onFinish={handleUpdate} autoComplete="off">
                <Form.Item
                    label="Tên"
                    name="deviceName"
                    rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item label="Loại thiết bị" name="deviceType" rules={[{ required: true, message: "Vui lòng chọn loại" }]}>
                    <Select options={DEVICE_TYPE_SELECT_OPTIONS} />
                </Form.Item>
                <Form.Item
                    label="Cố định / Lưu động"
                    name="mobilityType"
                    rules={[{ required: true, message: "Vui lòng chọn kiểu gắn" }]}
                >
                    <Select options={MOBILITY_TYPE_SELECT_OPTIONS} />
                </Form.Item>
                <Form.Item label="Hãng" name="manufacturer">
                    <Input />
                </Form.Item>
                <Form.Item label="Model" name="model">
                    <Input />
                </Form.Item>
                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item label="Ảnh thiết bị">
                    <Upload
                        listType="picture-circle"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onChange={handleChange}
                        customRequest={handleUpload}
                        accept=".jpg,.jpeg,.png,.webp"
                    >
                        {fileList.length >= 1 ? null : uploadButton}
                    </Upload>
                    {previewImage ? (
                        <Image
                            styles={{ root: { display: "none" } }}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: setPreviewOpen,
                                afterOpenChange: (v) => !v && setPreviewImage(""),
                            }}
                            src={previewImage}
                        />
                    ) : null}
                </Form.Item>
                <Form.Item name="imageUrl" hidden>
                    <Input />
                </Form.Item>

                <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
                    <Select options={STATUS_SELECT_OPTIONS} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalUpdateDeviceCatalog;
