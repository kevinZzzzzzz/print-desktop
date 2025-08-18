import React, { useState, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import { Space, Button, Select, Input  } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { setting } from "./setting";

function HomePage(props: any) {
  const [printList, setPrintList] = useState<any>([]);
  const [setPrint, setSetPrint] = useState<any>("");
  const [host, setHost] = useState<string>(setting.host);
  const [sseHost, setSseHost] = useState<string>(setting.sseHost);
  const [clientId, setClientId] = useState<string>(setting.clientId);
  const printUrl = useRef<string>("");
  let eventSource = null
  let resetTimer = null
  let resetCount = 0
  const resetTime = 10000 


  useEffect(() => {
    const localHost =
      window.localStorage.getItem("host") || setting.host || null;
    const localSseHost =
      window.localStorage.getItem("sseHost") || setting.sseHost || null;
    const localClientId =
      window.localStorage.getItem("clientId") || setting.clientId || null;
    setHost(localHost);
    setSseHost(localSseHost);
    setClientId(localClientId);
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

    handleSSE(localSseHost, localHost, localClientId);
    return () => {
      eventSource.close()
      clearTimeout(resetTimer)
      resetCount = 0
    }
  }, []);

  const handlePrint = () => {
    if (!printUrl.current) return false;
    window.$electronAPI.printFile({
      url: printUrl.current,
      deviceName: setPrint,
    });
  };
  const handleSSE = (LSseHost, lHost, lClientId) => {
    if (!LSseHost) return false;
    // const eventSource = new EventSource(`${window.location.origin}/api/sse`);
    try {
      eventSource = new EventSource(`${LSseHost}?clientId=${lClientId}`);
      eventSource.onopen = () => {
        console.log("Connected to SSE server");
      };
      eventSource.onmessage = (event) => {
        if (!event.data) return false;
        const { params, uri } = JSON.parse(event.data);
        const url = `${lHost}${uri}?${handleParams(params)}`;
        printUrl.current = url;
        handlePrint();
      };

      eventSource.onerror = (err) => {
        if (resetCount < 5) {
          window.$electronAPI.showNotification("错误提示",  "稍等，正在尝试重连。。。")
          resetCount++
          resetTimer = setTimeout(() => {
            handleSSE(LSseHost, lHost, lClientId)
          }, resetTime)
        } else {
          window.$electronAPI.showNotification("错误提示",  "SSE连接失败")
          throw new Error("SSE连接失败")
        }
      };
    } catch (error) {
      eventSource.close()
      clearTimeout(resetTimer)
      resetCount = 0
      resetTimer = null
      eventSource = null
    }
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
          <p>设备ID：</p>
          <Space.Compact>
            <Input
              value={clientId}
              type="number"
              style={{ width: 100 }}
              placeholder="请输入设备ID"
              onChange={(e: any) => {
                setClientId(e.target.value);
                window.localStorage.setItem("clientId", e.target.value);
              }}
            />
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              保存
            </Button>
          </Space.Compact>
        </Space>
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
          {/* <Button
            type="primary"
            onClick={() => {
              handlePrint();
            }}
          >
            打印
          </Button> */}
          {/* <Button>预览</Button> */}
          {/* <Button type="primary" shape="circle" icon={<SettingOutlined />} /> */}
        </Space>
        <Space>
          <p>服务端地址：</p>
          <Space.Compact>
            <Input
              value={host}
              style={{ width: 400 }}
              placeholder="请输入服务端地址"
              onChange={(e: any) => {
                setHost(e.target.value);
                window.localStorage.setItem("host", e.target.value);
              }}
            />
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              保存
            </Button>
          </Space.Compact>
        </Space>
        <Space>
          <p>SSE地址：</p>
          <Space.Compact>
            <Input
              value={sseHost}
              style={{ width: 400 }}
              placeholder="请输入SSE地址"
              onChange={(e: any) => {
                setSseHost(e.target.value);
                window.localStorage.setItem("sseHost", e.target.value);
              }}
            />
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              保存
            </Button>
          </Space.Compact>
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
