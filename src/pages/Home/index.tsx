import React, { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import { Space, Button, Select, Input } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { setting } from "./setting";

function HomePage(props: any) {
  const [printList, setPrintList] = useState<any>([]);
  const [setPrint, setSetPrint] = useState<any>("");
  const [host, setHost] = useState<string>(setting.url);
  const printUrl = useRef<string>("");

  useEffect(() => {
    // handleSSE();
    console.log(window.$electronAPI.getPrintInfo());
    setPrintList(() => {
      return window.$electronAPI.getPrintInfo().map((d, idx) => {
        if (d.isDefault) {
          setSetPrint(d.name);
        }
        return {
          value: d.name,
          label: <span>{d.name}</span>,
        };
      });
    });
  }, []);

  const handlePrint = () => {
    // console.log("Received message:", printUrl.current);
    // if (!printUrl.current) return false;
    window.$electronAPI.printFile({
      // url: printUrl.current,
      url: "https://id97768mz34.vicp.fun/report/generate/sql/out_blood?clientId=1303&recordId=ZC20241227003&type=1&stationType=bloodcompanynet&facility.id=104",
      deviceName: setPrint,
    });
  };
  const handleSSE = () => {
    const eventSource = new EventSource(`${window.location.origin}/api/sse`);
    eventSource.onopen = () => {
      console.log("Connected to SSE server");
    };
    eventSource.onmessage = (event) => {
      console.log(event);
      const { params, uri } = JSON.parse(event.data);
      const url = `${host}${uri}?${handleParams(params)}`;
      printUrl.current = url;
      handlePrint();
    };

    eventSource.onerror = (err) => {
      console.error("Error:", err);
    };
  };

  const handleParams = (param) => {
    let str = "";
    for (const key in param) {
      if (Object.prototype.hasOwnProperty.call(param, key)) {
        str += `${key}=${param[key]}&`;
      }
    }
    return str.slice(0, -1);
  };
  return (
    <div className={styles.homePage}>
      <Space direction="vertical">
        <h1>Print Desktop</h1>
        <Space>
          <p>本地打印机：</p>
          <Select
            showSearch
            value={setPrint}
            style={{ width: 200 }}
            placeholder="请选择打印机"
            options={printList}
            onSelect={(d) => {
              setSetPrint(d);
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              handlePrint();
            }}
          >
            打印
          </Button>
          <Button>预览</Button>
          <Button type="primary" shape="circle" icon={<SettingOutlined />} />
        </Space>
        <Space>
          <p>服务端地址：</p>
          <Input
            value={host}
            style={{ width: 400 }}
            placeholder="请输入服务端地址"
            onChange={(e: any) => {
              setHost(e.target.value);
            }}
          />
        </Space>
        {/* <embed
          className={styles.homePage_iframe}
          type="application/pdf"
          src={
            "https://id97768mz34.vicp.fun/report/generate/sql/out_blood?clientId=1303&recordId=ZC20241227003&type=1&stationType=bloodcompanynet&facility.id=104"
          }
        ></embed> */}
      </Space>
    </div>
  );
}
export default HomePage;
