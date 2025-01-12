import React, {useContext, useEffect} from 'react';
import {Breadcrumb, Layout, Spin, Tabs} from "antd";
import {useLocation, useNavigate, UNSAFE_NavigationContext} from "react-router-dom";
import {useLayoutDispatch, useLayoutState} from "./AppLayoutContext";
import NavigationIcon from "./NavigationIcon";
import PageRouter from "../../pages/router/PageRouter";
import classNames from "classnames";
import themeConfig from "../../config/theme.config.json";
import {MemberAccessLogger} from "../../logger/member.access.logger";
import {MemberContext} from "../../auth/member.context";

const {TabPane} = Tabs;

function Content() {
  let navigate = useNavigate();
  let location = useLocation();
  const layoutState = useLayoutState();
  const layoutDispatch = useLayoutDispatch();
  const navigation = useContext(UNSAFE_NavigationContext).navigator;

  useEffect(() => {
    const pathname = location.pathname;
    layoutDispatch({
      type: 'ADD_TAB_PAGE', pathname
    });
  }, [
    layoutDispatch,location.pathname
  ]);

  useEffect(() => {
    if (navigation) {
      navigation.listen((locationListener) => {
        const pathname = locationListener.location.pathname;
        layoutDispatch({
          type: 'ADD_TAB_PAGE', pathname
        });

        layoutDispatch({
          type: 'INIT_NAVIGATION', pathname
        });

        if(MemberContext.available) {
          MemberAccessLogger.logPageAccess(pathname);
        }
      });
    }
  }, [layoutDispatch, navigation]);


  const handlePageHistoryTabClick = (pageTabId) => {
    if (pageTabId !== layoutState.pageTab.current.id) {
      const find = layoutState.pageTab.histories.filter(history => history.id === pageTabId);
      if (find.length === 1) {
        navigate(find[0].link);
      }
    }
  }

  const handlePageHistoryTabEdit = (pageTabId, action) => {
    if (action === "remove" && layoutState.pageTab.histories.length > 1) {
      const id = pageTabId;
      if (layoutState.pageTab.current.id === id) {
        // 현재 페이지를 삭제할 때
        const newHistories = layoutState.pageTab.histories.filter(history => history.id !== id);
        const currentPage = newHistories.slice(-1)[0];
        navigate(currentPage.link);
        layoutDispatch({
          type: 'REMOVE_TAB_PAGE', id, currentPage
        });
      } else {
        // 다른 페이지를 삭제할 때
        layoutDispatch({
          type: 'REMOVE_TAB_PAGE', id
        });
      }
    }
  }

  return (
    <Layout.Content className={classNames('site-layout-content', {dark: themeConfig.dark})}>
      <Tabs hideAdd type="editable-card" activeKey={layoutState.pageTab.current.id}
            onTabClick={handlePageHistoryTabClick} onEdit={handlePageHistoryTabEdit}>
        {layoutState.pageTab.histories && layoutState.pageTab.histories.map(page => {
            let TabIcon = null;
            if (page.icon && page.icon.length > 0) {
              TabIcon = NavigationIcon(page.icon);
            }
            return (
              <TabPane tab={<>{TabIcon && <TabIcon/>}&nbsp;{page.title}</>} key={page.id}>
                {layoutState.pageTab.current.id === page.id &&
                <>
                  <div className="site-breadcrumb">
                    <Breadcrumb>
                      {layoutState.breadcrumbItems.map((item, index) => (
                        <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
                      ))}
                    </Breadcrumb>
                    <div className="page-title">
                      {page.title}
                    </div>
                  </div>
                  <div className={classNames('site-layout-page', {dark: themeConfig.dark})}>
                    <Spin spinning={layoutState.loading}>
                      <PageRouter/>
                    </Spin>
                  </div>
                </>}
              </TabPane>
            )
          }
        )}
      </Tabs>
    </Layout.Content>
  )
}

export default Content;
