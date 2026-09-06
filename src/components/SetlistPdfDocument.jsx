import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 30,
    paddingBottom: 60,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    position: 'relative'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  eventName: {
    fontSize: 20,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  bandDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '47%',
    flexDirection: 'column',
  },
  songItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, 
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  songIndex: {
    fontSize: 16,
    color: '#999999',
    width: 28,
    fontFamily: 'Helvetica-Bold',
  },
  songTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 15,
    color: '#000000',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  songArtist: {
    fontSize: 6, 
    color: '#888888',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginTop: 1.5,
  },
  dividerItem: {
    width: '100%',
    marginBottom: 10, 
    paddingBottom: 4,
    justifyContent: 'center',
  },
  dividerText: {
    fontSize: 11,
    color: '#000000',
    backgroundColor: '#eeeeee',
    padding: 5,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 9,
    color: '#999999',
    fontFamily: 'Helvetica-Bold',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#dddddd',
  },
  footerPromoText: {
    fontSize: 8,
    color: '#888888',
    fontFamily: 'Helvetica',
  },
  footerPromoTextBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMainText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    letterSpacing: -0.5,
  },
  logoAccentText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#777777', 
  }
});

const truncate = (str, max) => {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 2) + ".." : str;
};

export const SetlistPdfDocument = ({ eventName, bandName, date, orderedItems }) => {
  let songCounter = 1;

  const itemsWithNumbers = orderedItems.map((item) => {
    if (item.item_type === 'divider') {
      return { ...item, isDivider: true };
    } else {
      const currentNum = songCounter++;
      return { ...item, isDivider: false, songNumber: currentNum };
    }
  });

  const LIMIT_PAGE_1 = 16; 
  const LIMIT_PAGE_2 = 20; 

  const chunksPages = [];
  let index = 0;
  let isFirstPage = true;

  while (index < itemsWithNumbers.length) {
    const limit = isFirstPage ? LIMIT_PAGE_1 : LIMIT_PAGE_2;
    
    const leftCol = itemsWithNumbers.slice(index, index + limit);
    index += leftCol.length;
    
    const rightCol = itemsWithNumbers.slice(index, index + limit);
    index += rightCol.length;
    
    chunksPages.push({ left: leftCol, right: rightCol, isFirstPage });
    isFirstPage = false;
  }

  const renderColumn = (columnItems) => {
    return columnItems.map((item, idx) => {
      if (item.isDivider) {
        return (
          <View key={item.id || idx} style={styles.dividerItem}>
            <Text style={styles.dividerText}>{truncate(item.content || "---", 25)}</Text>
          </View>
        );
      }

      const song = item.songs;
      const title = song ? song.title : "Música Deletada";
      const artist = song ? song.artist : "";

      return (
        <View key={item.id || idx} style={styles.songItem}>
          <Text style={styles.songIndex}>{item.songNumber.toString().padStart(2, '0')}</Text>
          <View style={styles.songTextContainer}>
            <Text style={styles.songTitle}>{truncate(title, 22)}</Text>
            {artist ? <Text style={styles.songArtist}>{truncate(artist, 35)}</Text> : null}
          </View>
        </View>
      );
    });
  };

  return (
    <Document>
      {chunksPages.map((pageData, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          
          {pageData.isFirstPage ? (
            <View style={styles.header}>
              <Text style={styles.eventName}>{eventName || "MEU REPERTÓRIO"}</Text>
              <View style={styles.bandDateRow}>
                <Text style={styles.subtitle}>{bandName || "Banda / Artista"}</Text>
                <Text style={styles.subtitle}>
                  {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : ""}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.header, { marginBottom: 15, paddingBottom: 4, borderBottomWidth: 2 }]}>
              <Text style={[styles.subtitle, { fontSize: 10, color: '#999999' }]}>
                {eventName || "REPERTÓRIO"} · PÁGINA {pageIdx + 1}
              </Text>
            </View>
          )}

          <View style={styles.grid} wrap={false}>
            <View style={styles.column}>
              {renderColumn(pageData.left)}
            </View>
            <View style={styles.column}>
              {renderColumn(pageData.right)}
            </View>
          </View>

          <View style={styles.footerContainer} fixed>
            <View style={styles.footerLeft}>
              <Text style={styles.pageNumber}>{pageIdx + 1} / {chunksPages.length}</Text>
              <Text style={styles.footerPromoText}>
                Criado com <Text style={styles.footerPromoTextBold}>CANTA.PRO</Text> — Organize repertórios em um só lugar. Acesse <Text style={styles.footerPromoTextBold}>www.canta.pro</Text>
              </Text>
            </View>
            
            <View style={styles.logoContainer}>
              <Text style={styles.logoMainText}>CANTA</Text>
              <Text style={styles.logoAccentText}>.PRO</Text>
            </View>
          </View>

        </Page>
      ))}
    </Document>
  );
};