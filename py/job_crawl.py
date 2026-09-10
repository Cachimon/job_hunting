import json
import os
import re
import sys
import traceback
from urllib.parse import parse_qs, urlparse

from DrissionPage import Chromium
from DrissionPage._configs.chromium_options import ChromiumOptions
from ollama import Client
from openai import OpenAI
from pydantic import BaseModel, Field


import random
import time
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font


class AIConfigMode(BaseModel):
    model: str
    api_key: str | None = None
    base_url: str

class ConfigModel(BaseModel):

    chrome_path: str | None = None
    backlist_company: list[str] = []
    desc_blackwords: list[str] = []
    desc_whitewords: list[str] = []
    desc_type: str | None = None
    is_hunter: bool = Field(default=False)  # 允许猎头
    job_path: str | None = None
    port: int = Field(default=2222)
    delay_time: int = 400
    done_count: int = 30
    search_word: str | None = None
    is_ai: bool = Field(default=False)
    model: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    score: int = 80
    system_prompt: str | None = None
    resume_text: str | None = None
    start_url: str | None = None
    filename_fix: str = 'job_list'
    record_only: bool = False

config = ConfigModel()
is_done = False
tab = None
browser = None

class ExcelData(BaseModel):
    job_name: str
    job_desc: str
    company: str
    salary: str
    location: str
    active_time: str
    recruiter: str
    recruiter_title: str
    score: float | str
    reason: str
    status: str
    detail_url: str | None = None
    experience: str | None = None


def llm_analysis(job_desc: str):
    sys_prompt = config.system_prompt
    sys_prompt += """
    你可以根据简历和岗位描述分析出匹配分数，以及可以有理有据地阐述原因。按照以下格式输出：
    {"score": "满分100，评估匹配分数", "reason": "阐述为何是这个分数"}

    """
    sys_prompt += f"""

    # 简历内容
    {config.resume_text}
    """

    jd_prompt = f"""
    # 岗位
    {job_desc}
    """
    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": jd_prompt},
    ]

    if config.base_url == 'http://localhost:11434':
        model_name = config.model
        client = Client(host="http://localhost:11434", timeout=1 * 60 * 60)
        response = client.chat(
            model=model_name,  # 确保使用支持工具调用的模型[reference:7]
            messages=messages,
        )
        raw = response.message.content
    else:
        client = OpenAI(
            base_url=config.base_url,  # 指向网关地址
            api_key=config.api_key,
        )

        response = client.chat.completions.create(
            model=config.model,  # 换模型只需改这里
            messages=messages,
            max_tokens=65536,
            temperature=0.7
        )

        raw = response.choices[0].message.content

    raw = re.sub(r"^.*?```json\s*", "", raw, flags=re.DOTALL)
    raw = re.sub(r"\s*```.*$", "", raw, flags=re.DOTALL)
    raw = raw.strip()

    try:
        content = json.loads(raw)
    except json.JSONDecodeError:
        score_match = re.search(r'"score"\s*:\s*"?(\d+)"?', raw)
        reason_match = re.search(r'"reason"\s*:\s*"(.*)"', raw, re.DOTALL)
        content = {
            "score": score_match.group(1) if score_match else "N/A",
            "reason": reason_match.group(1).rstrip('"') if reason_match else "解析失败",
        }


    return content


def is_black_company(company: str):
    for com in config.backlist_company:
        if com in company:
            return True
    return False


def get_data(crawl_type: str):
    if not config.job_path:
        return []
    job_dir = Path(config.job_path) / f"{crawl_type}_{config.filename_fix}"
    if not job_dir.exists():
        output_handler("debug", f"岗位存储目录【{job_dir}】不存在")

        return []
    excel_data = []
    for file_path in job_dir.iterdir():
        if file_path.suffix == ".xlsx":
            wb = load_workbook(file_path, read_only=True)
            ws = wb.active

            try:
                # 获取第1列到第3列（即A~C列）的所有行数据，values_only=True直接取值
                for row in ws.iter_rows(min_row=2, values_only=True):
                    # row 是一个元组，包含该行第1~3列的值
                    excel_data.append(f"{row[0]}_{row[3]}")
            except:
                pass
            wb.close()

    return excel_data


def is_near(location: str):
    if not config.location_list:
        return True
    for loc in config.location_list:
        if loc in location:
            return True
    return False



def save(craw_type: str, data: ExcelData):

    file_name = f"{craw_type}_{config.filename_fix}/{config.filename_fix}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    file_path = Path(config.job_path) / file_name
    if not file_path.parent.exists():
        file_path.parent.mkdir(parents=True, exist_ok=True)
    if file_path.exists():
        wb = load_workbook(file_path)
        ws = wb.active
    else:
        # 文件不存在则新建
        wb = Workbook()
        ws = wb.active
        ws.append(
            [
                "岗位名称",
                "岗位描述",
                "经验",
                "公司",
                "工资",
                "工作地点",
                "招聘人",
                "招聘人职位",
                "在线时间",
                "分数",
                "理由",
                "投递状态",
                "详情链接",
            ]
        )

        # 设置样式[reference:32][reference:33]
        header_font = Font(bold=True)
        for cell in ws[1]:  # 第一行标题加粗
            cell.font = header_font

    ws.append(
        [
            data.job_name,
            data.job_desc,
            data.experience,
            data.company,
            data.salary,
            data.location,
            data.recruiter,
            data.recruiter_title,
            data.active_time,
            data.score,
            data.reason,
            data.status,
            data.detail_url,
        ]
    )

    wb.save(file_path)  # 保存修改


def human_delay():
    # 对数正态分布，mu=1, sigma=0.6，产生1~5秒左右的自然间隔
    delay = random.lognormvariate(1, 0.6)
    # 限制最大最小值，防止过长或过短
    time.sleep(min(max(delay, 0.8), 6.0))


def stay_time_by_content(text_content_len):
    word_count = text_content_len
    # 假设人类阅读速度每秒300字，基础停留至少2秒，再随机波动
    read_time = max(2.0, word_count / 300)
    # 增加30%以内的随机浮动
    final_delay = read_time * random.uniform(0.8, 1.3)
    time.sleep(final_delay)

def get_query_from_url():
    # 1. 解析 URL
    parsed = urlparse(config.start_url)

    # 2. 获取查询字符串（? 后面的部分）
    query_string = parsed.query

    # 3. 解析成字典
    params = parse_qs(query_string)

    # 4. 取出 query 参数的值
    query_value = params.get('query', [None])[0]

    return query_value

def start_chrome():
    global browser, tab
    # 启动或接管浏览器，并获取标签页对象
    co = ChromiumOptions().set_browser_path(config.chrome_path).set_local_port(config.port)
    browser = Chromium(addr_or_opts=co)
    tab = browser.latest_tab
    url = config.start_url

    query_from_url = get_query_from_url()
    if not query_from_url and config.search_word:
        url += f'&query={config.search_word}'

    # 跳转到登录页面
    tab.get(url)

def filter_desc(desc: str):
    if config.desc_type == 'black':
        for word in config.desc_blackwords:
            if word in desc:
                return False
        return True
    if config.desc_type == 'white':
        for word in config.desc_whitewords:
            if word in desc:
                return True
            return False
    return True

def start_crawl():
    global is_done, tab
    if not tab:
        output_handler("error", "未找到浏览器")
        return

    if config.record_only:
        output_handler("data", f"仅记录模式，将只记录岗位信息{'和AI分析数据' if config.is_ai else ''}，不进行投递。")
    exist_data = get_data("boss")
    start = 0
    done_count = 0
    current_url = tab.url

    cards = tab.eles(".:card-area")
    while start < len(cards):
        if done_count >= config.done_count:
            output_handler("done", "已完成指定投递个数")
            is_done = True
            break
        card = cards[start]
        start += 1

        for i in range(3):

            card.click()

            human_delay()

            card_name = card.ele(".job-name").text
            detail_name = tab.ele(".job-detail-box").ele(".job-name").text

            if card_name == detail_name:
                break

        if card_name == detail_name:
            delay_time = random.randint(config.delay_time - 100, config.delay_time + 100)
            stay_time_by_content(delay_time)

            desc = (
                tab.ele(".job-detail-body")
                .ele(".desc")
                .text.replace("BOSS直聘", "")
                .replace("boss直聘", "")
                .replace("Boss直聘", "")
                .replace("BOSS", "")
                .replace("boss", "")
                .replace("直聘", "")
                .replace("kanzhun", "")
                .replace("看准", "")
            )

            boss_info = tab.ele(".boss-info-attr").text
            boss_info_arr = boss_info.split("·")
            company = boss_info_arr[0]
            recruiter_title = boss_info_arr[1]
            output_handler("data", f"查看岗位名称：{detail_name}, {company}")


            salary = tab.ele(".job-detail-info").ele(".job-salary").text

            try:
                location = tab.ele(".job-address-desc").text
            except:
                location = ""

            recruiter = (
                tab.ele(".job-boss-info").ele(".name").raw_text.split("\n")[0]
            )

            try:
                active_time = (
                        tab.ele(".job-boss-info").ele(".boss-active-time").raw_text or ""
                )
            except:
                active_time = ""

            try:
                detail_url = tab.ele(".more-job-btn").attr("href")
            except:
                detail_url = ""

            try:
                experience = tab.ele(".job-detail-header").ele(".tag-list").eles("@tag()=li")[1].text
            except:
                experience = ""

            if f"{card_name}_{company}" in exist_data:
                output_handler("data", f"【{card_name}_{company}】岗位已存在")
                continue
            else:
                excel_data = ExcelData(
                    job_name=card_name,
                    job_desc=desc,
                    company=company,
                    salary=salary,
                    location=location,
                    recruiter=recruiter,
                    recruiter_title=recruiter_title,
                    score=0,
                    reason="非目标区域",
                    status="未投递",
                    active_time=active_time,
                    detail_url=detail_url,
                    experience=experience,
                )

                btn = tab.ele('.:op-btn-chat')  # 查找class属性包含_cls的元素
                if btn and btn.text and btn.text.strip() == '继续沟通':
                    excel_data.status = "已投递"
                    excel_data.reason = '已沟通过了，跳过'
                elif not filter_desc(desc):
                    excel_data.reason = "岗位描述包含不符合要求的字符串"
                elif not config.is_hunter and "猎头" in recruiter_title:
                    excel_data.reason = "猎头"
                elif is_black_company(company):
                    excel_data.reason = "黑名单公司"
                else:
                    if config.is_ai:
                        output_handler("data", "开始进行AI分析")
                        analyse_result = llm_analysis(desc)
                        score = int(analyse_result.get("score", ""))
                        reason = analyse_result.get("reason", "")
                        output_handler('data', f'分析结果\n分数：{score}\n理由：{reason}')

                        excel_data.score = score
                        excel_data.reason = reason

                        if score > config.score:
                            if config.record_only:
                                excel_data.status = "仅记录模式"
                                done_count += 1
                            else:
                                for i in range(3):
                                    try:
                                        btn = tab.ele(".:op-btn-chat")
                                        btn.click()
                                        human_delay()
                                        stay_btn = tab.ele(".:cancel-btn")
                                        stay_btn.click()
                                        human_delay()

                                        excel_data.status = "已投递"
                                        done_count += 1
                                        output_handler("data", f"投递岗位名称：{card_name}\n岗位描述：\n{desc}\n投递理由：{score}")
                                        break
                                    except:
                                        pass
                    else:
                        excel_data.reason = "无需AI分析"
                        if config.record_only:
                            excel_data.status = "仅记录模式"
                            done_count += 1
                        else:
                            for i in range(3):
                                try:
                                    btn = tab.ele(".:op-btn-chat")
                                    btn.click()
                                    human_delay()
                                    stay_btn = tab.ele(".:cancel-btn")
                                    stay_btn.click()
                                    human_delay()
                                    excel_data.status = "已投递"
                                    done_count += 1
                                    output_handler("data", f"投递岗位名称：{card_name}\n岗位描述：\n{desc}")
                                    break
                                except:
                                    pass
                exist_data.append(f"{card_name}_{company}")
                output_handler("debug", f"存数据：{card_name}_{company}")
                save("boss", excel_data)

        cards = tab.eles(".:card-area")
        if len(cards) == 0:
            tab.get(current_url)
            time.sleep(5)
            cards = tab.eles(".:card-area")
            start = 0
        output_handler("debug", f"当前进度, {start}, {len(cards)}")
        output_handler("data", f"投递个数：{done_count}")
    if done_count < config.done_count:
        output_handler("done", "无岗位")
        is_done = True

def dispatch(data):
    global config, is_done, tab, browser
    input_type = data["type"]
    if input_type == "init":
        config.chrome_path = data["chrome_path"]
        config.backlist_company = data.get("backlist_company", [])
        config.desc_blackwords = data.get("desc_blackwords", [])
        config.desc_whitewords = data.get("desc_whitewords", [])
        config.desc_type = data.get("desc_type", 'none')
        config.is_hunter = False if data.get("is_hunter", 0) == 0 else True
        config.job_path = data["job_path"]
        config.port = data.get("port", 2222)
        config.delay_time = data.get("delay_time", 400)
        config.done_count = data.get("done_count", 30)
        config.search_word = data.get("search_word", "")
        config.is_ai = False if data.get("is_ai", 0) == 0 else True
        config.model = data.get("model", "")
        config.base_url = data.get("base_url", "")
        config.api_key = data.get("api_key", "")
        config.score = data.get("score", 80)
        config.system_prompt = data.get("system_prompt", "")
        config.resume_text = data.get("resume_text", "")
        config.start_url = data.get("start_url", "https://www.zhipin.com/web/geek/jobs")
        config.filename_fix = data.get('filename_fix', 'job_list')
        config.record_only = False if data.get("record_only", 0) == 0 else True


        chrome_path = config.chrome_path
        if chrome_path is None or not Path(chrome_path).exists():
            output_handler("error", "浏览器路径不存在")
            return
        if config.is_ai and not config.model:
            output_handler("error", "如需启用AI分析，请配置模型名称")
            return
        if config.is_ai and not config.base_url:
            output_handler("error", "如需启用AI分析，请配置模型链接")
            return
        if config.is_ai and not config.api_key:
            output_handler("error", "如需启用AI分析，请配置模型API KEY")
            return
        if config.is_ai and not config.resume_text:
            output_handler("error", "如需启用AI分析，请设置有效的简历文件")
            return
        start_chrome()
        output_handler("pending", "check if it is ready")
    elif input_type == "check":
        start_crawl()
    elif input_type == 'exit':
        config = None
        is_done = False
        if browser:
            browser.quit()
            tab = None


def output_handler(status, msg):
    info = {"status": status, "msg": msg}
    print(json.dumps(info, ensure_ascii=False))
    sys.stdout.flush()  # 重要：立即刷新缓冲区

# pyinstaller --onefile job_crawl.py
if __name__ == "__main__":
    output_handler("debug", f"Python PID: {os.getpid()}")
    for line in sys.stdin:
        output_handler("test", f"测试输入：{line}")
        try:
            data = json.loads(line.strip())
        except:
            continue

        try:
            dispatch(data)
        except Exception as e:
            stack_trace = traceback.format_exc()
            output_handler("error", stack_trace)

