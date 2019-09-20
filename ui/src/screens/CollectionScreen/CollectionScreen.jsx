import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Screen from 'src/components/Screen/Screen';
import CollectionContextLoader from 'src/components/Collection/CollectionContextLoader';
import CollectionHeading from 'src/components/Collection/CollectionHeading';
import CollectionInfoMode from 'src/components/Collection/CollectionInfoMode';
import CollectionViews from 'src/components/Collection/CollectionViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Collection, DualPane, Breadcrumbs } from 'src/components/common';
import { selectCollection, selectCollectionView } from 'src/selectors';
import { CollectionManageButton } from 'src/components/Toolbar';


const messages = defineMessages({
  placeholder: {
    id: 'collections.index.filter',
    defaultMessage: 'Search in {label}',
  },
  xref_title: {
    id: 'collections.xref.title',
    defaultMessage: 'Cross-reference',
  },
});


export class CollectionScreen extends Component {
  onSearch(queryText) {
    const { history, collection } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  render() {
    const {
      intl, collection, collectionId, activeMode,
    } = this.props;
    const { extraBreadcrumbs } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.shouldLoad || collection.isLoading) {
      return (
        <CollectionContextLoader collectionId={collectionId}>
          <LoadingScreen />
        </CollectionContextLoader>
      );
    }

    const searchScope = {
      listItem: <Collection.Label collection={collection} icon truncate={30} />,
      label: collection.label,
      onSearch: this.onSearch.bind(this),
    };

    const operation = (
      <CollectionManageButton collection={collection} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} />
        {activeMode === 'xref' && (
          <Breadcrumbs.Text text={intl.formatMessage(messages.xref_title)} />
        )}
        {extraBreadcrumbs}
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
          searchScopes={[searchScope]}
        >
          {breadcrumbs}
          <DualPane itemScope itemType="https://schema.org/Dataset">
            <DualPane.InfoPane className="with-heading">
              <CollectionHeading collection={collection} />
              <div className="pane-content">
                <CollectionInfoMode collection={collection} />
              </div>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              <CollectionViews
                collection={collection}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </CollectionContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    activeMode: selectCollectionView(state, collectionId, hashQuery.mode),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionScreen);
