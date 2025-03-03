import koa from "koa";
import KoaRouter from "koa-router";
import { PassThrough } from "stream";

const app = new koa();
const router = new KoaRouter();

let response = {
  code: 200,
  data: {
    uri: "report/generate/sql/out_blood",
    params: {
      clientId: 1303,
      recordId: "ZC20241227003",
      type: 1,
      stationType: "bloodcompanynet",
      "facility.id": 104,
    },
  },
};
let printSign = false;
router.get("/sse", async (ctx) => {
  ctx.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // ctx.status = 200; //模拟持续服务端传值给客户端
  const stream = new PassThrough();
  ctx.status = 200;
  setInterval(() => {
    const count = Math.floor(Math.random() * 6);
    console.log(count);
    if (count == 4) {
      stream.write(`id: 1\n`);
      stream.write(`data: ${JSON.stringify(response.data)}\n`);
      stream.write("retry: 1000\n");
      stream.write("\n\n");
    } else {
      stream.write(`id: 2\n`);
      stream.write("retry: 1000\n");
      stream.write("\n\n");
    }
  }, 1000);
  ctx.body = stream;
});

router.get("/printSign", async (ctx) => {
  printSign = true;
  ctx.body = {
    code: 200,
    data: "操作成功",
  };
});
app.use(router.routes()).use(router.allowedMethods()); // 对请求进行一些限制处理
// 监听3000端口
app.listen(3000, () => {
  console.log("Server running at http://127.0.0.1:3000");
});
