## 简介
[![Build Status](https://travis-ci.org/shaojie-li/react-ts-core.svg?branch=master)](https://travis-ci.org/shaojie-li/react-ts-core)
[![npm version](https://badge.fury.io/js/react-ts-core.svg)](https://badge.fury.io/js/react-ts-core)
[![Coverage Status](https://coveralls.io/repos/github/shaojie-li/react-ts-core/badge.svg)](https://coveralls.io/github/shaojie-li/react-ts-core)

react-ts-core 是一个基于 react、redux、typescript 的前端开发框架。

## 基本功能

redux 数据处理

每个模块都有自己独立的 state 和 action，用于处理业务逻辑

无论同步还是异步方法，每个 action 都由 saga 的 generator 函数取处理

为了扩展每个模块的功能，为它们提供了一套自己的生命周期，例如 onEnter / onDestroy 等。

## 高级功能

（1）全局错误处理程序

（2）事件日志收集器

（3）内置装饰器

## 核心 API

- startApp

启动程序，配置入口组件/错误处理程序/日志/初始化动作。

- register

注册一个模块（包括生命周期操作和自定义操作）。

## 用法

待完成，等有时间会用 vuePress 出一个在线文档。
写了一个demo可供参考 https://github.com/shaojie-li/react-ts-core-demo

## 参考

在一定程度上受到了 dva 框架的启发

https://github.com/dvajs/dva
